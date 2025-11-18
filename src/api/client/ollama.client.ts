import { injectable } from "tsyringe";
import { up } from "up-fetch";
import * as Ollama from "@/api/schema/ollama.client.ts";

@injectable()
export default class OllamaClient {
    private client = up(fetch, () => ({
        baseUrl: process.env.OLLAMA_API_URL ?? "http://localhost:11434",
    }));

    async getModels(): Promise<Ollama.ModelsResponse> {
        return this.client("/api/tags", { schema: Ollama.ModelsResponseSchema });
    }

    async getDetails(modelId: string): Promise<Ollama.ModelDetailsResponse> {
        return this.client("/api/show", {
            method: "POST",
            body: { model: modelId },
            schema: Ollama.ModelDetailsResponse,
        });
    }
}
