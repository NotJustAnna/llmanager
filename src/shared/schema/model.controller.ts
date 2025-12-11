import { z } from "zod";

export const Pricing = z.discriminatedUnion("type", [
    z.object({ type: z.literal("free") }),
    z.object({ type: z.literal("paid"), prompt: z.number(), completion: z.number(), request: z.number() }),
]);
export type Pricing = z.infer<typeof Pricing>;

export const Model = z.object({
    name: z.string(), // e.g., "Qwen3 8B"
    id: z.string(), // e.g., "ollama.qwen3:8b" -- Follows the same format as OpenWebUI.
    description: z.string(),
    pricing: Pricing,
    imageUrl: z.httpUrl(),
    allowed: z.boolean(),
    createdAt: z.coerce.date().optional(), // Creation/modification date from provider
});
export type Model = z.infer<typeof Model>;

// Allowlist update schemas
export const UpdateAllowlistReq = z.object({
    whitelistIds: z.array(
        z.string().refine((id) => id.startsWith("ollama.") || id.startsWith("openrouter."), {
            message: 'Model ID must start with "ollama." or "openrouter."',
        }),
    ),
});
export type UpdateAllowlistReq = z.infer<typeof UpdateAllowlistReq>;

export const UpdateAllowlistRes = z.object({
    success: z.literal(true),
    modelCount: z.object({
        openrouter: z.number(),
        ollama: z.number(),
        invalid: z.number(),
    }),
    message: z.string(),
});
export type UpdateAllowlistRes = z.infer<typeof UpdateAllowlistRes>;

// Edit model schemas
export const EditModelReq = z.object({
    modelId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
});
export type EditModelReq = z.infer<typeof EditModelReq>;

export const EditModelRes = z.object({
    success: z.boolean(),
    message: z.string(),
});
export type EditModelRes = z.infer<typeof EditModelRes>;

// Generate name schemas
export const GenerateNameReq = z.object({
    modelId: z.string(),
});
export type GenerateNameReq = z.infer<typeof GenerateNameReq>;

export const GenerateNameRes = z.object({
    name: z.string(),
});
export type GenerateNameRes = z.infer<typeof GenerateNameRes>;

// Generate description schemas
export const GenerateDescriptionReq = z.object({
    modelId: z.string(),
});
export type GenerateDescriptionReq = z.infer<typeof GenerateDescriptionReq>;

export const GenerateDescriptionRes = z.object({
    description: z.string(),
});
export type GenerateDescriptionRes = z.infer<typeof GenerateDescriptionRes>;
