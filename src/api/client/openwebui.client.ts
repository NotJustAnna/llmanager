import { injectable } from "tsyringe";
import { up } from "up-fetch";
import {
    type CompletionRequest,
    type CompletionResponse,
    CompletionResponseSchema,
    type OpenAiConfigRequest,
    OpenAiConfigRequestSchema,
    type OllamaConfigRequest,
    OllamaConfigRequestSchema,
    type ModelDetail,
    ModelDetailSchema,
    type ModelForm,
    ModelFormSchema,
    type CreateModelRequest,
    CreateModelRequestSchema,
} from "@/api/schema/openwebui.client.ts";

@injectable()
export default class OpenWebUiClient {
    private client = up(fetch, () => ({
        baseUrl: process.env.OPENWEBUI_API_URL ?? "http://localhost:3000",
        headers: { Authorization: `Bearer ${process.env.OPENWEBUI_API_KEY}` },
    }));

    async complete(req: CompletionRequest): Promise<CompletionResponse> {
        return this.client("/api/chat/completions", {
            method: "POST",
            body: req,
            schema: CompletionResponseSchema,
        });
    }

    /**
     * Update OpenAI API configuration (e.g., for OpenRouter).
     * upfetch automatically handles 2xx status code success.
     */
    async updateOpenAiConfig(config: OpenAiConfigRequest): Promise<void> {
        OpenAiConfigRequestSchema.parse(config);
        await this.client("/openai/config/update", {
            method: "POST",
            body: config,
        });
    }

    /**
     * Update Ollama API configuration.
     * upfetch automatically handles 2xx status code success.
     */
    async updateOllamaConfig(config: OllamaConfigRequest): Promise<void> {
        OllamaConfigRequestSchema.parse(config);
        await this.client("/ollama/config/update", {
            method: "POST",
            body: config,
        });
    }

    /**
     * Fetch a single model's details from OpenWebUI.
     * Returns the model if found, null otherwise.
     */
    async getModelDetails(modelId: string): Promise<ModelDetail | null> {
        try {
            return await this.client(`/api/v1/models/model?id=${encodeURIComponent(modelId)}`, {
                schema: ModelDetailSchema,
            });
        } catch (error) {
            if (error instanceof Response && error.status === 404) {
                return null;
            }
            console.error(`Error fetching model details for "${modelId}":`, error);
            return null;
        }
    }

    /**
     * Update model metadata via POST to /api/v1/models/model/update.
     * Expects a full ModelForm body merged with current model data.
     * Returns true if successful, false if 401/404/422/409 (model not registered or needs creation).
     */
    async patchModel(modelId: string, modelForm: ModelForm): Promise<boolean> {
        try {
            // Validate the ModelForm before sending
            ModelFormSchema.parse(modelForm);
            await this.client(`/api/v1/models/model/update?id=${encodeURIComponent(modelId)}`, {
                method: "POST",
                body: modelForm,
            });
            return true;
        } catch (error) {
            if (error instanceof Response) {
                // 401/404/422/409 indicate the model needs to be created first
                if (error.status === 401 || error.status === 404 || error.status === 422 || error.status === 409) {
                    return false;
                }
                throw error;
            }
            console.error(`Error updating model "${modelId}":`, error);
            throw error;
        }
    }

    /**
     * Create a new model registry entry.
     * Accepts full CreateModelRequest (same structure as ModelForm).
     * Returns true if successful, false otherwise.
     */
    async createModel(createRequest: CreateModelRequest): Promise<boolean> {
        try {
            CreateModelRequestSchema.parse(createRequest);
            await this.client("/api/v1/models/create", {
                method: "POST",
                body: createRequest,
            });
            return true;
        } catch (error) {
            console.error(`Error creating model "${createRequest.name}":`, error);
            return false;
        }
    }
}
