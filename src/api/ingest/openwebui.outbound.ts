import { injectable } from "tsyringe";
import OpenWebUiClient from "@/api/client/openwebui.client.ts";
import DatabaseService from "@/api/service/database.service.ts";
import { Model as DatabaseModel } from "@/api/schema/model.database.ts";
import {log4js} from "@notjustanna/log4js";
import { formatTokensPerCent } from "@/shared/lib/pricing";

/**
 * OpenWebUI outbound integration for model metadata updates.
 *
 * Handles both synchronous and asynchronous model metadata updates to OpenWebUI
 * and the local database. Uses the upsert pattern per LLM_QUERIES.md:
 * 1. Try to PATCH (update) the registry entry via `/api/v1/models/model/update?id={id}`
 * 2. If update fails (model not registered), POST full ModelForm to `/api/v1/models/create`
 *
 * Provides queue-based async updates via queueModelUpdate() and immediate
 * synchronous updates via syncUpdateModel().
 *
 * Database Model ID and OpenWebUI Model ID are equivalent and don't require conversion.
 */
@injectable()
export default class OpenWebUiOutbound {
    private readonly logger = log4js("OpenWebUiOutbound");
    private readonly modelUpdateQueue: Set<string> = new Set();
    private isBackgroundUpdating: boolean = false;

    constructor(
        private readonly openwebui: OpenWebUiClient,
        private readonly database: DatabaseService,
    ) {}

    /**
     * Queue a model for asynchronous metadata update.
     * The background task will process queued models periodically.
     */
    queueModelUpdate(modelId: string): void {
        if (OpenWebUiOutbound.addToSet(this.modelUpdateQueue, modelId) && !this.isBackgroundUpdating) {
            this.isBackgroundUpdating = true;
            this.backgroundUpdateLoop().finally(() => {
                this.isBackgroundUpdating = false;
            });
        }
    }

    /**
     * Synchronously update a model's metadata on OpenWebUI.
     * Blocks until the update is complete.
     */
    async syncUpdateModel(modelId: string): Promise<boolean> {
        const dbModel = this.database.getModel(modelId);
        if (!dbModel) {
            console.warn(`Model "${modelId}" not found in database`);
            return false;
        }

        return await this.updateModelMetadata(dbModel);
    }

    /**
     * Main update logic: try update → create pattern.
     * Updates OpenWebUI with model metadata from the database model.
     * Per LLM_QUERIES.md, POST /api/v1/models/create accepts full ModelForm structure.
     */
    private async updateModelMetadata(dbModel: DatabaseModel): Promise<boolean> {
        try {
            // Step 1: Fetch single model details from OpenWebUI using the model ID
            const model = await this.openwebui.getModelDetails(dbModel.id);

            // Step 2: Build the description with provider/pricing information
            const description = this.buildDescriptionWithProvider(dbModel);

            // Step 3: Build ModelForm with database updates merged with existing OpenWebUI data
            const modelForm = {
                id: dbModel.id,
                base_model_id: model?.base_model_id ?? null,
                name: dbModel.name,
                meta: {
                    ...(model?.meta ?? {}),
                    description: description ?? model?.meta?.description,
                    profile_image_url: dbModel.imageUrl ?? model?.meta?.profile_image_url,
                },
                params: model?.params ?? {},
                access_control: model?.access_control ?? null,
                is_active: model?.is_active ?? true,
            };

            // Step 4: Try to update the model
            const updateSuccess = await this.openwebui.patchModel(dbModel.id, modelForm);
            if (updateSuccess) {
                return true;
            }

            // Step 5: Model not registered, create a registry entry with full ModelForm
            return await this.openwebui.createModel(modelForm);
        } catch (error) {
            console.error(`Failed to update model metadata for "${dbModel.id}":`, error);
            return false;
        }
    }

    /**
     * Append provider/pricing information to the description based on model ID.
     */
    private buildDescriptionWithProvider(dbModel: DatabaseModel): string {
        let description = dbModel.description;

        if (dbModel.id.startsWith("ollama.")) {
            description += " (Local)";
        } else if (dbModel.id.startsWith("openrouter.")) {
            if (dbModel.id.endsWith(":free")) {
                description += " (Free)";
            } else {
                const inputFormatted = formatTokensPerCent(parseFloat(dbModel.promptPrice));
                const outputFormatted = formatTokensPerCent(parseFloat(dbModel.completionPrice));
                description += ` (Input: ${inputFormatted} t/¢ | Output: ${outputFormatted} t/¢)`;
            }
        }

        return description;
    }

    /**
     * Background task that processes queued model updates with rate limiting.
     */
    private async backgroundUpdateLoop(): Promise<void> {
        while (this.modelUpdateQueue.size > 0) {
            const startTime = Date.now();
            const modelId = this.modelUpdateQueue.values().next().value;

            if (modelId) {
                try {
                    this.modelUpdateQueue.delete(modelId);

                    // Fetch the model from the database
                    const dbModel = this.database.getModel(modelId);
                    if (dbModel) {
                        await this.updateModelMetadata(dbModel);
                    } else {
                        console.warn(`Queued model "${modelId}" not found in database`);
                    }
                } catch (error) {
                    this.logger.error(`Error updating model "${modelId}":`, { error });
                }
            }

            // Rate limiting: ensure minimum 2s between updates
            const elapsed = Date.now() - startTime;
            const waitTime = Math.max(0, 2000 - elapsed);
            if (waitTime > 0) {
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
        }
    }

    /**
     * Helper: add item to set if not already present, return true if added.
     */
    private static addToSet(set: Set<string>, item: string): boolean {
        if (!set.has(item)) {
            set.add(item);
            return true;
        }
        return false;
    }
}
