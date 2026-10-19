import type { AdminRoom, AdminRoomsResponse } from "@/types/admin-room";
import type { ResourceOptionsResponse } from "@/types/room-catalog";

export function makeAdminRoom(overrides: Partial<AdminRoom> = {}): AdminRoom {
  return {
    id: 1,
    name: "Ipê",
    description: "Sala de reunião",
    capacity: 8,
    address: "Torre A",
    complement: "Sala 5",
    imageUrl: null,
    maxReservationDurationMinutes: 240,
    resourceIds: [1],
    ...overrides,
  };
}

export function makeAdminRoomsResponse(
  items: AdminRoom[] = [makeAdminRoom()],
  pagination: Partial<AdminRoomsResponse["pagination"]> = {},
): AdminRoomsResponse {
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

export function makeResourceOptions(): ResourceOptionsResponse {
  return {
    items: [
      { id: 1, code: "projector", name: "Projetor" },
      { id: 2, code: "video", name: "Videoconferência" },
    ],
  };
}
