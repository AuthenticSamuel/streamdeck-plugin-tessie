import z from "zod";

export const settings = z.object({
  tessieAccessToken: z.string().optional(),
});

export type GlobalSettings = z.infer<typeof settings>;
