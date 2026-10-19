import { z } from "zod";
import { roomQuerySchema } from "@/server/schemas/rooms";

export const adminRoomQuerySchema = roomQuerySchema.strict();

export const adminRoomIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().safe());

export const adminRoomInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1),
  capacity: z.number().int().positive().safe(),
  address: z.string().trim().min(1).max(160),
  complement: z
    .string()
    .trim()
    .max(160)
    .nullable()
    .optional()
    .transform((value) => value || null),
  resourceIds: z
    .array(z.number().int().positive().safe())
    .refine((ids) => new Set(ids).size === ids.length),
});

export type AdminRoomQuery = z.infer<typeof adminRoomQuerySchema>;
export type AdminRoomInput = z.infer<typeof adminRoomInputSchema>;
