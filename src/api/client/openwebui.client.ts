import { injectable } from "tsyringe";
import { up } from "up-fetch";
import {
    type CompletionRequest,
    type CompletionResponse,
    CompletionResponseSchema,
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
}
