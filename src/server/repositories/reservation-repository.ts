import { Op, Transaction } from "sequelize";
import type { Transaction as SequelizeTransaction } from "sequelize";
import { Reservation, Room, sequelize } from "@/server/db/models";

export function findRoomById(roomId: number) {
  return Room.findByPk(roomId);
}

export function findReservationsInRange(
  roomId: number,
  start: Date,
  end: Date,
) {
  return Reservation.findAll({
    where: {
      roomId,
      startsAt: { [Op.lt]: end },
      endsAt: { [Op.gt]: start },
    },
    order: [
      ["startsAt", "ASC"],
      ["id", "ASC"],
    ],
  });
}

export function withImmediateTransaction<T>(
  work: (transaction: SequelizeTransaction) => Promise<T>,
): Promise<T> {
  return sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, work);
}

export function findOverlappingReservation(
  roomId: number,
  start: Date,
  end: Date,
  transaction: SequelizeTransaction,
) {
  return Reservation.findOne({
    where: {
      roomId,
      startsAt: { [Op.lt]: end },
      endsAt: { [Op.gt]: start },
    },
    transaction,
  });
}

export function insertReservation(
  input: { userId: number; roomId: number; startsAt: Date; endsAt: Date },
  transaction: SequelizeTransaction,
) {
  return Reservation.create(input, { transaction });
}
