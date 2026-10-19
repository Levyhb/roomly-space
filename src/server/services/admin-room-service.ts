import { UniqueConstraintError } from "sequelize";
import type { Room } from "@/server/db/models";
import { ApiError } from "@/server/http/api-error";
import {
  countExistingResources,
  findAdminRoomById,
  findAdminRoomWithResources,
  findAllRoomNames,
  insertAdminRoom,
  replaceRoomResources,
  updateAdminRoom,
  withAdminRoomTransaction,
} from "@/server/repositories/admin-room-repository";
import { findRooms } from "@/server/repositories/room-repository";
import type {
  AdminRoomInput,
  AdminRoomQuery,
} from "@/server/schemas/admin-rooms";

const PAGE_SIZE = 10;
const capacityBounds = {
  "2-4": [2, 4],
  "5-8": [5, 8],
  "9-12": [9, 12],
  "13-plus": [13, undefined],
} as const;

function roomOutput(room: Room) {
  return {
    id: room.id,
    name: room.name,
    description: room.description,
    capacity: room.capacity,
    address: room.address,
    complement: room.complement,
    imageUrl: room.imageUrl,
    resourceIds: (room.resources ?? [])
      .map((resource) => resource.id)
      .sort((a, b) => a - b),
  };
}

export async function listAdminRooms(query: AdminRoomQuery) {
  const bounds = query.capacity ? capacityBounds[query.capacity] : undefined;
  const { rows, count } = await findRooms({
    q: query.q,
    minCapacity: bounds?.[0],
    maxCapacity: bounds?.[1],
    resource: query.resource,
    page: query.page,
    pageSize: PAGE_SIZE,
  });
  return {
    items: rows.map(roomOutput),
    pagination: {
      page: query.page,
      pageSize: PAGE_SIZE,
      totalItems: count,
      totalPages: Math.ceil(count / PAGE_SIZE),
    },
  };
}

async function validateRoomReferences(
  input: AdminRoomInput,
  currentRoomId: number | null,
  transaction: Parameters<typeof findAllRoomNames>[0],
) {
  const rooms = await findAllRoomNames(transaction);
  const duplicate = rooms.some(
    (room) =>
      room.id !== currentRoomId &&
      room.name.toLocaleLowerCase("pt-BR") ===
        input.name.toLocaleLowerCase("pt-BR"),
  );
  if (duplicate) {
    throw new ApiError(409, "ROOM_NAME_CONFLICT", "Nome de sala já utilizado");
  }
  if (
    input.resourceIds.length &&
    (await countExistingResources(input.resourceIds, transaction)) !==
      input.resourceIds.length
  ) {
    throw new ApiError(400, "INVALID_INPUT", "Recurso inexistente");
  }
}

async function loadRoom(id: number) {
  const room = await findAdminRoomWithResources(id);
  if (!room) throw new Error("Sala recém-gravada não encontrada");
  return roomOutput(room);
}

function isSqliteBusy(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    parent?: { code?: string };
    original?: { code?: string };
  };
  return [candidate.parent?.code, candidate.original?.code].some(
    (code) =>
      code?.startsWith("SQLITE_BUSY") || code?.startsWith("SQLITE_LOCKED"),
  );
}

async function handleWrite<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ApiError(
        409,
        "ROOM_NAME_CONFLICT",
        "Nome de sala já utilizado",
      );
    }
    if (isSqliteBusy(error)) {
      throw new ApiError(
        409,
        "ROOM_WRITE_CONFLICT",
        "Sala ocupada; tente novamente",
      );
    }
    throw error;
  }
}

export function createAdminRoom(input: AdminRoomInput) {
  return handleWrite(async () => {
    const roomId = await withAdminRoomTransaction(async (transaction) => {
      await validateRoomReferences(input, null, transaction);
      const room = await insertAdminRoom(input, transaction);
      await replaceRoomResources(room.id, input.resourceIds, transaction);
      return room.id;
    });
    return loadRoom(roomId);
  });
}

export function editAdminRoom(roomId: number, input: AdminRoomInput) {
  return handleWrite(async () => {
    await withAdminRoomTransaction(async (transaction) => {
      const room = await findAdminRoomById(roomId, transaction);
      if (!room) {
        throw new ApiError(404, "ROOM_NOT_FOUND", "Sala não encontrada");
      }
      await validateRoomReferences(input, roomId, transaction);
      await updateAdminRoom(room, input, transaction);
      await replaceRoomResources(roomId, input.resourceIds, transaction);
    });
    return loadRoom(roomId);
  });
}
