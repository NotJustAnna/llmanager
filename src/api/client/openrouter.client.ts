import { injectable } from "tsyringe";
import { up } from "up-fetch";
import * as OpenRouter from "@/api/schema/openrouter.client.ts";

@injectable()
export default class OpenrouterClient {
    private client = up(fetch, () => ({
        baseUrl: process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1",
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    }));

    async getCredits(): Promise<OpenRouter.CreditsResponse> {
        return this.client("/credits", { schema: OpenRouter.CreditsResponse });
    }
}
