import { z } from "zod";
import { isValidDate } from "@/server/time/booking-time";

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isValidDate);

export const roomIdParamSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().safe());

export const availabilityQuerySchema = z.strictObject({ date: dateSchema });

export const createReservationSchema = z.strictObject({
  roomId: z.number().int().positive().safe(),
  date: dateSchema,
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const listReservationsQuerySchema = z.strictObject({
  q: z.string().trim().max(120).default(""),
  status: z.enum(["active", "completed", "all"]).default("active"),
  page: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().safe())
    .default(1),
});

export const reservationIdParamSchema = roomIdParamSchema;

export type ListReservationsInput = z.infer<typeof listReservationsQuerySchema>;
