import { Op, Transaction } from "sequelize";
import type { Transaction as SequelizeTransaction } from "sequelize";
import { Resource, Room, RoomResource, sequelize } from "@/server/db/models";
import type { AdminRoomInput } from "@/server/schemas/admin-rooms";

export function withAdminRoomTransaction<T>(
  work: (transaction: SequelizeTransaction) => Promise<T>,
): Promise<T> {
  return sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, work);
}

export function findAdminRoomById(
  id: number,
  transaction?: SequelizeTransaction,
) {
  return Room.findByPk(id, { transaction });
}

export function findAllRoomNames(transaction: SequelizeTransaction) {
  return Room.findAll({ attributes: ["id", "name"], transaction });
}

export function countExistingResources(
  ids: number[],
  transaction: SequelizeTransaction,
) {
  return Resource.count({ where: { id: { [Op.in]: ids } }, transaction });
}

export function insertAdminRoom(
  input: AdminRoomInput,
  transaction: SequelizeTransaction,
) {
  return Room.create(
    {
      name: input.name,
      description: input.description,
      capacity: input.capacity,
      maxReservationDurationMinutes: input.maxReservationDurationMinutes,
      address: input.address,
      complement: input.complement,
      imageUrl: null,
    },
    { transaction },
  );
}

export function updateAdminRoom(
  room: Room,
  input: AdminRoomInput,
  transaction: SequelizeTransaction,
) {
  return room.update(
    {
      name: input.name,
      description: input.description,
      capacity: input.capacity,
      maxReservationDurationMinutes: input.maxReservationDurationMinutes,
      address: input.address,
      complement: input.complement,
    },
    { transaction },
  );
}

export async function replaceRoomResources(
  roomId: number,
  resourceIds: number[],
  transaction: SequelizeTransaction,
): Promise<void> {
  await RoomResource.destroy({ where: { roomId }, transaction });
  if (resourceIds.length) {
    await RoomResource.bulkCreate(
      resourceIds.map((resourceId) => ({ roomId, resourceId })),
      { transaction },
    );
  }
}

export function findAdminRoomWithResources(id: number) {
  return Room.findByPk(id, {
    include: [
      {
        model: Resource,
        as: "resources",
        attributes: ["id", "code", "name"],
        through: { attributes: [] },
      },
    ],
  });
}
