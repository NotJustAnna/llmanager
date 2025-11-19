import { z } from "zod";

export const Settings = z.object({
    generativeModel: z.string().nullable(),
});
export type Settings = z.infer<typeof Settings>;
