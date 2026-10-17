import { z } from "zod";

export const selectUserSchema = z.strictObject({
  userId: z.number().int().positive(),
});
