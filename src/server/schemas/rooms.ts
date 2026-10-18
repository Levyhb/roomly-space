import { z } from "zod";

export const roomQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(120)
    .transform((value) => value || undefined)
    .optional(),
  capacity: z.enum(["2-4", "5-8", "9-12", "13-plus"]).optional(),
  resource: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .max(50)
    .optional(),
  page: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().safe())
    .optional()
    .default(1),
});

export type RoomQuery = z.infer<typeof roomQuerySchema>;
