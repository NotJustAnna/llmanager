import { injectable } from "tsyringe";
import AuthMiddleware from "@/api/middleware/auth.middleware.ts";
import ModelService from "@/api/service/model.service.ts";
import * as ModelSchema from "@/shared/schema/model.controller.ts";

@injectable()
export default class ModelController {
    constructor(
        private readonly auth: AuthMiddleware,
        private readonly modelService: ModelService,
    ) {}

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

        // Extract provider from query parameters
        const url = new URL(req.url);
        const provider = url.searchParams.get("provider");

        // Validate provider parameter if provided
        if (provider && provider !== "openrouter" && provider !== "ollama") {
            return Response.json({ error: 'Invalid provider. Must be "openrouter" or "ollama".' }, { status: 400 });
        }

        // Get models from service
        const models = this.modelService.listModels(provider as "openrouter" | "ollama" | undefined);

        // Parse and return models using the schema
        return Response.json(models.map((model) => ModelSchema.Model.parse(model)));
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

        // Parse and validate request body
        const body = await req.json();
        const parsedBody = ModelSchema.EditModelReq.parse(body);

        // Update model via service
        const success = await this.modelService.editModel(parsedBody.modelId, {
            name: parsedBody.name,
            description: parsedBody.description,
        });

        const result = {
            success,
            message: success
                ? `Model "${parsedBody.modelId}" updated successfully`
                : `Failed to update model "${parsedBody.modelId}"`,
        };

        // Parse and return response
        return Response.json(ModelSchema.EditModelRes.parse(result));
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

        // Parse and validate request body
        const body = await req.json();
        const parsedBody = ModelSchema.UpdateAllowlistReq.parse(body);

        // Update allowlist via service
        const result = await this.modelService.updateAllowlist(parsedBody.whitelistIds);

        // Parse and return response
        return Response.json(ModelSchema.UpdateAllowlistRes.parse(result));
    }

    /*
     * Clears the allowlist for a specific provider.
     *
     * query parameters:
     *   - provider: "openrouter" | "ollama" (required)
     */
    async clearAllowlist(req: Request): Promise<Response> {
        if (!this.auth.valid(req)) {
            return this.auth.reject();
        }

        // Extract provider from query parameters
        const url = new URL(req.url);
        const provider = url.searchParams.get("provider");

        // Validate provider parameter
        if (!provider || (provider !== "openrouter" && provider !== "ollama")) {
            return Response.json(
                { error: 'Missing or invalid provider. Must be "openrouter" or "ollama".' },
                { status: 400 },
            );
        }

        // Clear allowlist via service
        const result = await this.modelService.clearAllowlist(provider as "openrouter" | "ollama");

        // Parse and return response
        return Response.json(ModelSchema.UpdateAllowlistRes.parse(result));
    }

    /*
     * Generates a name for a model based on its ID.
     */
    async generateName(req: Request): Promise<Response> {
        if (!this.auth.valid(req)) {
            return this.auth.reject();
        }

        const body = await req.json();
        const parsedBody = ModelSchema.GenerateNameReq.parse(body);

        const name = await this.modelService.generateName(parsedBody.modelId);

        return Response.json(ModelSchema.GenerateNameRes.parse({ name }));
    }

    /*
     * Generates a description for a model based on its ID.
     */
    async generateDescription(req: Request): Promise<Response> {
        if (!this.auth.valid(req)) {
            return this.auth.reject();
        }

        const body = await req.json();
        const parsedBody = ModelSchema.GenerateDescriptionReq.parse(body);

        const description = await this.modelService.generateDescription(parsedBody.modelId);

        return Response.json(ModelSchema.GenerateDescriptionRes.parse({ description }));
    }
}
