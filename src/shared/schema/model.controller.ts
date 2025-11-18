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
});
export type Model = z.infer<typeof Model>;
