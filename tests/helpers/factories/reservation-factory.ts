import type { CreateReservationInput } from "@/server/schemas/reservations";

export function makeReservationInput(
  overrides: Partial<CreateReservationInput> = {},
): CreateReservationInput {
  return {
    roomId: 1,
    date: "2030-10-20",
    startTime: "10:00",
    endTime: "11:00",
    ...overrides,
  };
}
