import { z } from "zod";

export const CreditsResponse = z.object({
    data: z.object({
        total_credits: z.number(),
        total_usage: z.number(),
    }),
});


export type CreditsResponse = z.infer<typeof CreditsResponse>;
