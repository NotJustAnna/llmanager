import { z } from "zod";
import { createTableDDL } from "@datazod/zod-sql";

export const Model = z.object({
    name: z.string(), // e.g., "Qwen3 8B"
    id: z.string(), // e.g., "ollama.qwen3:8b" -- Follows the same format as OpenWebUI.
    description: z.string(),
    promptPrice: z.string(),
    completionPrice: z.string(),
    imageUrl: z.httpUrl(),
});
export const ModelDDL = createTableDDL("models", Model, { primaryKey: "id" });
export type Model = z.infer<typeof Model>;
