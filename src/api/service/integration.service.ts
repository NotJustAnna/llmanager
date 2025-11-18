import { injectable } from "tsyringe";
import OpenrouterClient from "@/api/client/openrouter.client.ts";
import * as Integration from "@/shared/schema/integration.controller.ts";

@injectable()
export default class IntegrationService {
    constructor(private readonly client: OpenrouterClient) {}

    async getOpenRouterCredits(): Promise<Integration.OpenRouterCreditsRes> {
        const { data } = await this.client.getCredits();
        return { totals: { credits: data.total_credits, usage: data.total_usage } };
    }
}
