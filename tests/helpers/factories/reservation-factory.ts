import type { CreateReservationInput } from "@/server/schemas/reservations";
import type {
  OwnReservation,
  OwnReservationsResponse,
} from "@/types/own-reservation";

export function makeReservationInput(
  overrides: Partial<CreateReservationInput> = {},
): CreateReservationInput {
  return {
    roomId: 1,
    date: "2030-10-21",
    startTime: "10:00",
    endTime: "11:00",
    ...overrides,
  };
}

export function makeOwnReservation(
  overrides: Partial<OwnReservation> = {},
): OwnReservation {
  return {
    id: 1,
    startsAt: "2030-10-20T13:00:00.000Z",
    endsAt: "2030-10-20T14:00:00.000Z",
    status: "SCHEDULED",
    room: {
      id: 1,
      name: "Ipê",
      address: "Torre A · 3º andar",
      capacity: 8,
      imageUrl: null,
    },
    ...overrides,
  };
}

export function makeOwnReservationsResponse(
  items: OwnReservation[] = [makeOwnReservation()],
  pagination: Partial<OwnReservationsResponse["pagination"]> = {},
): OwnReservationsResponse {
  return {
    items,
    pagination: {
      page: 1,
      pageSize: 10,
      totalItems: items.length,
      totalPages: items.length ? 1 : 0,
      ...pagination,
    },
  };
}
