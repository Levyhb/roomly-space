import {
  findResources,
  findRooms,
} from "@/server/repositories/room-repository";
import type { RoomQuery } from "@/server/schemas/rooms";

const PAGE_SIZE = 12;

const capacityBounds = {
  "2-4": [2, 4],
  "5-8": [5, 8],
  "9-12": [9, 12],
  "13-plus": [13, undefined],
} as const;

export async function getRoomCatalog(query: RoomQuery) {
  const bounds = query.capacity ? capacityBounds[query.capacity] : undefined;
  const result = await findRooms({
    q: query.q,
    minCapacity: bounds?.[0],
    maxCapacity: bounds?.[1],
    resource: query.resource,
    page: query.page,
    pageSize: PAGE_SIZE,
  });

  return {
    items: result.rows.map((room) => ({
      id: room.id,
      name: room.name,
      address: room.address,
      complement: room.complement,
      description: room.description,
      capacity: room.capacity,
      imageUrl: room.imageUrl,
      maxReservationDurationMinutes: room.maxReservationDurationMinutes,
      resources: (room.resources ?? [])
        .map((resource) => ({ code: resource.code, name: resource.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    })),
    pagination: {
      page: query.page,
      pageSize: PAGE_SIZE,
      totalItems: result.count,
      totalPages: Math.ceil(result.count / PAGE_SIZE),
    },
  };
}

export async function getResourceOptions() {
  const resources = await findResources();
  return {
    items: resources.map((resource) => ({
      id: resource.id,
      code: resource.code,
      name: resource.name,
    })),
  };
}
