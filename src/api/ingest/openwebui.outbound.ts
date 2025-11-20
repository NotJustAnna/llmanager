import { injectable } from "tsyringe";
import OpenWebUiClient from "@/api/client/openwebui.client.ts";
import DatabaseService from "@/api/service/database.service.ts";
import { Model as DatabaseModel } from "@/api/schema/model.database.ts";

/**
 * OpenWebUI outbound integration for model metadata updates.
 *
 * Handles both synchronous and asynchronous model metadata updates to OpenWebUI
 * and the local database. Uses the idempotent upsert pattern as documented in
 * OPENWEBUI_SHENANIGANS.md:
 * 1. Try to PATCH (update) the registry entry via `/api/v1/models/{id}`
 * 2. If update fails with 404/409/422, call POST `/api/v1/models/create`
 * 3. Retry update if needed
 *
 * Provides queue-based async updates via queueModelUpdate() and immediate
 * synchronous updates via syncUpdateModel().
 *
 * Database Model ID and OpenWebUI Model ID are equivalent and don't require conversion.
 */
@injectable()
export default class OpenWebUiOutbound {
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
        if (
            OpenWebUiOutbound.addToSet(this.modelUpdateQueue, modelId) &&
            !this.isBackgroundUpdating
        ) {
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
     * Main update logic: try update → create → retry pattern.
     * Updates OpenWebUI with model metadata from the database model.
     */
    private async updateModelMetadata(dbModel: DatabaseModel): Promise<boolean> {
        try {
            // Step 1: Fetch single model details from OpenWebUI using the model ID
            const model = await this.openwebui.getModelDetails(dbModel.id);

            if (!model) {
                console.warn(`Model "${dbModel.id}" not found on OpenWebUI`);
                return false;
            }

            // Step 2: Merge current model data with database updates to create full ModelForm
            const modelForm = {
                id: dbModel.id,
                base_model_id: model.base_model_id ?? null,
                name: dbModel.name,
                meta: {
                    ...(model.meta ?? {}),
                    description: dbModel.description ?? model.meta?.description,
                    profile_image_url: dbModel.imageUrl ?? model.meta?.profile_image_url,
                },
                params: model.params ?? {},
                access_control: model.access_control ?? null,
                is_active: model.is_active ?? true,
            };

            // Step 3: Try to update the model
            const updateSuccess = await this.openwebui.patchModel(dbModel.id, modelForm);
            if (updateSuccess) {
                return true;
            }

            // Step 4: Model not registered, try to create a registry entry
            const createSuccess = await this.openwebui.createModel(dbModel.name, {
                description: dbModel.description,
            });
            if (createSuccess) {
                // Step 5: Retry update after creation
                return await this.openwebui.patchModel(dbModel.id, modelForm);
            }

            return createSuccess;
        } catch (error) {
            console.error(
                `Failed to update model metadata for "${dbModel.id}":`,
                error,
            );
            return false;
        }
    }

    /**
     * Background task that processes queued model updates with rate limiting.
     */
    private async backgroundUpdateLoop(): Promise<void> {
        while (this.modelUpdateQueue.size > 0) {
            const startTime = Date.now();
            const modelId = this.modelUpdateQueue.values().next().value;

            if (modelId) {
                this.modelUpdateQueue.delete(modelId);

                // Fetch the model from the database
                const dbModel = this.database.getModel(modelId);
                if (dbModel) {
                    await this.updateModelMetadata(dbModel);
                } else {
                    console.warn(`Queued model "${modelId}" not found in database`);
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
