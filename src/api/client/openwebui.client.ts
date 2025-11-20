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
} from "@/api/schema/openwebui.client.ts";

@injectable()
export default class OpenWebUiClient {
    private client = up(fetch, () => ({
        baseUrl: process.env.OPENWEBUI_API_URL ?? "https://localhost:3000",
        headers: { Authorization: `Bearer ${process.env.OPENWEBUI_API_KEY}` },
    }));

    async complete(req: CompletionRequest): Promise<CompletionResponse> {
        return this.client("/api/chat/completions", {
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
}
