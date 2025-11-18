import { z } from "zod";

export const Settings = z.object({
    generatedModel: z.string().nullable(),
});
export type Settings = z.infer<typeof Settings>;
