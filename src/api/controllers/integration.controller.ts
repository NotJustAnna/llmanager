import { injectable } from "tsyringe";
import AuthMiddleware from "@/api/middleware/auth.middleware.ts";
import * as Integration from "@/shared/schema/integration.controller.ts";
import IntegrationService from "../service/integration.service";

@injectable()
export default class IntegrationController {
    constructor(
        private readonly auth: AuthMiddleware,
        private readonly integrationService: IntegrationService,
    ) {}

    /*
     * Use the OpenRouter API to get the user's remaining credits.
     */
    async getOpenRouterCredits(req: Request): Promise<Response> {
        if (!this.auth.valid(req)) {
            return this.auth.reject();
        }

        return Response.json(
            Integration.OpenRouterCreditsRes.parse(await this.integrationService.getOpenRouterCredits()),
        );
    }
}
