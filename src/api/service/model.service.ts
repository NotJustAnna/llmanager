import { injectable } from "tsyringe";
import OllamaIngest from "@/api/ingest/ollama.ingest.ts";
import OpenrouterIngest from "@/api/ingest/openrouter.ingest.ts";
import OpenWebUiOutbound from "@/api/ingest/openwebui.outbound.ts";
import DatabaseService from "@/api/service/database.service.ts";
import OpenWebUiClient from "@/api/client/openwebui.client.ts";
import { Model as DatabaseModel } from "@/api/schema/model.database.ts";
import * as ControllerSchema from "@/shared/schema/model.controller.ts";
import type { OpenAiConfigRequest, OllamaConfigRequest } from "@/api/schema/openwebui.client.ts";

interface EditModelUpdates {
    name?: string;
    description?: string;
}

@injectable()
export default class ModelService {
    constructor(
        private readonly openrouterIngest: OpenrouterIngest,
        private readonly ollamaIngest: OllamaIngest,
        private readonly database: DatabaseService,
        private readonly openwebui: OpenWebUiClient,
        private readonly outbound: OpenWebUiOutbound,
    ) {
        openrouterIngest.start();
        ollamaIngest.start();
    }

    /**
     * Get all models, optionally filtered by provider.
     * @param provider Optional provider filter: "openrouter" or "ollama"
     * @returns Array of models
     */
    listModels(provider?: "openrouter" | "ollama"): ControllerSchema.Model[] {
        let models = this.database.getAllModels();

        // Filter by provider if specified
        if (provider) {
            const prefix = `${provider}.`;
            models = models.filter((m) => m.id.startsWith(prefix));
        }

        // Transform from database schema to controller schema
        return models.map((model) => this.transformModel(model));
    }

    private transformModel(dbModel: DatabaseModel): ControllerSchema.Model {
        const pricing = this.parsePricing(dbModel.promptPrice, dbModel.completionPrice);
        const allowed = this.isModelAllowed(dbModel.id);

        return {
            name: dbModel.name,
            id: dbModel.id,
            description: dbModel.description,
            pricing,
            imageUrl: dbModel.imageUrl,
            allowed,
        };
    }

    private isModelAllowed(modelId: string): boolean {
        if (modelId.startsWith("openrouter.")) {
            const allowlist = this.getProviderAllowlist("openrouter");
            return allowlist.includes(modelId);
        } else if (modelId.startsWith("ollama.")) {
            const allowlist = this.getProviderAllowlist("ollama");
            return allowlist.includes(modelId);
        }
        return false;
    }

    private getProviderAllowlist(provider: "openrouter" | "ollama"): string[] {
        const allowlistJson = this.database.getValue(`allowlist:${provider}`);
        if (!allowlistJson) {
            return [];
        }
        try {
            return JSON.parse(allowlistJson);
        } catch {
            return [];
        }
    }

    private setProviderAllowlist(provider: "openrouter" | "ollama", modelIds: string[]): void {
        this.database.setValue(`allowlist:${provider}`, JSON.stringify(modelIds));
    }

    private parsePricing(promptPrice: string, completionPrice: string): ControllerSchema.Pricing {
        // Check if both prices are "Local" (Ollama case)
        if (promptPrice === "Local" && completionPrice === "Local") {
            return { type: "free" };
        }

        // Parse numeric prices (OpenRouter case)
        const promptNum = parseFloat(promptPrice);
        const completionNum = parseFloat(completionPrice);
        const requestNum = 0; // Default to 0; may need adjustment based on API structure

        if (!Number.isNaN(promptNum) && promptNum !== 0 && !Number.isNaN(completionNum) && completionNum !== 0) {
            return {
                type: "paid",
                prompt: promptNum,
                completion: completionNum,
                request: requestNum,
            };
        }

        // Fallback to free if parsing fails
        return { type: "free" };
    }

    /**
     * Update the allowlist for models by provider.
     * Groups models by provider and applies allowlists accordingly.
     * Only providers with models in the request will be affected.
     * Asynchronously queues model metadata updates to OpenWebUI.
     */
    async updateAllowlist(whitelistIds: string[]): Promise<ControllerSchema.UpdateAllowlistRes> {
        // Group IDs by provider
        const groupedIds = this.groupIdsByProvider(whitelistIds);
        const counts = { openrouter: 0, ollama: 0, invalid: 0 };

        // Update OpenRouter models if any
        if (groupedIds.openrouter.length > 0) {
            const openAiConfig = this.buildOpenAiConfig(groupedIds.openrouter);
            await this.openwebui.updateOpenAiConfig(openAiConfig);
            counts.openrouter = groupedIds.openrouter.length;
            this.setProviderAllowlist("openrouter", this.prefixIds(groupedIds.openrouter, "openrouter"));

            // Queue async updates to OpenWebUI for each model
            for (const modelId of this.prefixIds(groupedIds.openrouter, "openrouter")) {
                this.outbound.queueModelUpdate(modelId);
            }
        }

        // Update Ollama models if any
        if (groupedIds.ollama.length > 0) {
            const ollamaConfig = this.buildOllamaConfig(groupedIds.ollama);
            await this.openwebui.updateOllamaConfig(ollamaConfig);
            counts.ollama = groupedIds.ollama.length;
            this.setProviderAllowlist("ollama", this.prefixIds(groupedIds.ollama, "ollama"));

            // Queue async updates to OpenWebUI for each model
            for (const modelId of this.prefixIds(groupedIds.ollama, "ollama")) {
                this.outbound.queueModelUpdate(modelId);
            }
        }

        // Count invalid IDs
        counts.invalid = whitelistIds.length - counts.openrouter - counts.ollama;

        return {
            success: true,
            modelCount: counts,
            message: `Allowlist updated: ${counts.openrouter} OpenRouter models, ${counts.ollama} Ollama models${counts.invalid > 0 ? `, ${counts.invalid} invalid` : ""}`,
        };
    }

    /**
     * Edit a model's metadata (name and description).
     * Supports "<auto>" values to auto-generate name and description based on provider rules.
     * Queries the provider APIs for fresh, up-to-date information.
     * Synchronously updates OpenWebUI.
     */
    async editModel(modelId: string, updates: EditModelUpdates): Promise<boolean> {
        const dbModel = this.database.getModel(modelId);
        if (!dbModel) {
            console.warn(`Model "${modelId}" not found in database`);
            return false;
        }

        // Handle "<auto>" for name
        if (updates.name === "<auto>") {
            if (dbModel.id.startsWith("ollama.")) {
                const modelName = dbModel.id.substring("ollama.".length);
                updates.name = await this.ollamaIngest.generateAutoName(modelName);
            } else if (dbModel.id.startsWith("openrouter.")) {
                const modelId = dbModel.id.substring("openrouter.".length);
                updates.name = await this.openrouterIngest.generateAutoName(modelId);
            }
        }

        // Handle "<auto>" for description
        if (updates.description === "<auto>") {
            if (dbModel.id.startsWith("ollama.")) {
                const modelName = dbModel.id.substring("ollama.".length);
                updates.description = await this.ollamaIngest.generateAutoDescription(modelName);
            } else if (dbModel.id.startsWith("openrouter.")) {
                const modelId = dbModel.id.substring("openrouter.".length);
                updates.description = await this.openrouterIngest.generateAutoDescription(modelId);
            }
        }

        // Apply updates to database model
        if (updates.name) {
            dbModel.name = updates.name;
        }
        if (updates.description) {
            dbModel.description = updates.description;
        }

        // Update database
        this.database.setModel(dbModel);

        // Synchronously update OpenWebUI
        return await this.outbound.syncUpdateModel(modelId);
    }

    private groupIdsByProvider(ids: string[]): {
        openrouter: string[];
        ollama: string[];
    } {
        const grouped = { openrouter: [] as string[], ollama: [] as string[] };

        for (const id of ids) {
            if (id.startsWith("openrouter.")) {
                grouped.openrouter.push(id.replace("openrouter.", ""));
            } else if (id.startsWith("ollama.")) {
                grouped.ollama.push(id.replace("ollama.", ""));
            }
        }

        return grouped;
    }

    private prefixIds(ids: string[], provider: string): string[] {
        return ids.map((id) => `${provider}.${id}`);
    }

    private buildOpenAiConfig(modelIds: string[]): OpenAiConfigRequest {
        return {
            ENABLE_OPENAI_API: true,
            OPENAI_API_BASE_URLS: [process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1"],
            OPENAI_API_KEYS: [process.env.OPENROUTER_API_KEY ?? ""],
            OPENAI_API_CONFIGS: {
                "0": {
                    enable: true,
                    tags: [{ name: "OpenRouter" }],
                    prefix_id: "openrouter",
                    model_ids: modelIds,
                    connection_type: "external",
                    auth_type: "bearer",
                },
            },
        };
    }

    private buildOllamaConfig(modelIds: string[]): OllamaConfigRequest {
        return {
            ENABLE_OLLAMA_API: true,
            OLLAMA_BASE_URLS: [process.env.OLLAMA_API_URL ?? "http://localhost:11434"],
            OLLAMA_API_CONFIGS: {
                "0": {
                    enable: true,
                    tags: [],
                    prefix_id: "ollama",
                    model_ids: modelIds,
                    connection_type: "local",
                    auth_type: "none",
                    key: "",
                },
            },
        };
    }
}
