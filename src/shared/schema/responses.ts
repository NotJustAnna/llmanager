import { z } from "zod";

export const Responses_error = z.object({
    hint: z.string().optional(),
    message: z.string(),
});
export type Responses_error = z.infer<typeof Responses_error>;
