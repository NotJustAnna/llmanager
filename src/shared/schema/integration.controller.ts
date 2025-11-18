import { z } from "zod";

export const OpenRouterCreditsRes = z.object({
    totals: z.object({
        credits: z.number(),
        usage: z.number(),
    }),
});
export type OpenRouterCreditsRes = z.infer<typeof OpenRouterCreditsRes>;
