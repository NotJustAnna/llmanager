import { injectable } from "tsyringe";
import AuthMiddleware from "@/api/middleware/auth.middleware.ts";

@injectable()
export default class ModelController {
    constructor(private readonly auth: AuthMiddleware) {}

    /*
     * Gets all models from all integrated providers.
     *
     * query parameters:
     *   - provider?: "openrouter" | "ollama"
     */
    async listModels(req: Request): Promise<Response> {
        if (!this.auth.valid(req)) {
            return this.auth.reject();
        }
        throw new Error("Method not implemented.");
    }

    /*
     * Swiss-knife model editing endpoint.
     *   Allows updating name and description.
     *   If description = "<auto>", it will use AI to generate a description.
     *   If name = "<auto>", a name will be provided based on provider-specific rules.
     */
    async editModel(req: Request): Promise<Response> {
        if (!this.auth.valid(req)) {
            return this.auth.reject();
        }
        throw new Error("Method not implemented.");
    }

    /*
     * Updates the allowlist for models.
     *   Groups the models by provider and applies allowlists accordingly.
     *   NOTE: Only providers with models in the request will be affected.
     *     i.e., if a provider is missing from the request, its allowlist remains unchanged.
     */
    async updateAllowlist(req: Request): Promise<Response> {
        if (!this.auth.valid(req)) {
            return this.auth.reject();
        }
        throw new Error("Method not implemented.");
    }
}
