import type { CatalogRoom, RoomCatalogResponse } from "@/types/room-catalog";

export function makeRoom(overrides: Partial<CatalogRoom> = {}): CatalogRoom {
  return {
    id: 1,
    name: "Sala Ipê",
    address: "Torre A · 3º andar",
    description: "Espaço para reuniões de equipe.",
    capacity: 8,
    imageUrl: null,
    maxReservationDurationMinutes: 240,
    resources: [{ code: "projector", name: "Projetor" }],
    ...overrides,
  };
}

export function makeCatalog(
  overrides: Partial<RoomCatalogResponse> = {},
): RoomCatalogResponse {
  return {
    items: [makeRoom()],
    pagination: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 },
    ...overrides,
  };
}
