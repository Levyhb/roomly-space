import { col, fn, Op, Transaction, where as sqlWhere } from "sequelize";
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
      canceledAt: null,
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
      canceledAt: null,
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

export type OwnReservationSearch = {
  userId: number;
  q: string;
  status: "active" | "completed" | "all";
  page: number;
  now: Date;
};

export async function findOwnReservations(search: OwnReservationSearch) {
  let roomIds: number[] | undefined;
  if (search.q) {
    const rooms = await Room.findAll({
      attributes: ["id"],
      where: sqlWhere(
        fn(
          "instr",
          fn("lower", col("name")),
          search.q.toLocaleLowerCase("pt-BR"),
        ),
        { [Op.gt]: 0 },
      ),
    });
    roomIds = rooms.map((room) => room.id);
  }

  const where = {
    userId: search.userId,
    canceledAt: null,
    ...(roomIds && { roomId: { [Op.in]: roomIds } }),
    ...(search.status === "active" && { endsAt: { [Op.gt]: search.now } }),
    ...(search.status === "completed" && { endsAt: { [Op.lte]: search.now } }),
  };
  const now = sequelize.escape(search.now);
  const order =
    search.status === "active"
      ? [
          ["startsAt", "ASC"],
          ["id", "ASC"],
        ]
      : search.status === "completed"
        ? [
            ["endsAt", "DESC"],
            ["id", "ASC"],
          ]
        : [
            [
              sequelize.literal(`CASE WHEN ends_at > ${now} THEN 0 ELSE 1 END`),
              "ASC",
            ],
            [
              sequelize.literal(
                `CASE WHEN ends_at > ${now} THEN starts_at END`,
              ),
              "ASC",
            ],
            [
              sequelize.literal(`CASE WHEN ends_at <= ${now} THEN ends_at END`),
              "DESC",
            ],
            ["id", "ASC"],
          ];

  return Reservation.findAndCountAll({
    where,
    include: [
      {
        model: Room,
        as: "room",
        attributes: [
          "id",
          "name",
          "address",
          "complement",
          "capacity",
          "imageUrl",
        ],
        required: true,
      },
    ],
    order: order as Parameters<typeof Reservation.findAndCountAll>[0]["order"],
    limit: 10,
    offset: (search.page - 1) * 10,
  });
}

export function findOwnReservationById(
  reservationId: number,
  userId: number,
  transaction: SequelizeTransaction,
) {
  return Reservation.findOne({
    where: { id: reservationId, userId },
    transaction,
  });
}

export function markReservationCanceled(
  reservationId: number,
  userId: number,
  now: Date,
  transaction: SequelizeTransaction,
) {
  return Reservation.update(
    { canceledAt: now },
    {
      where: {
        id: reservationId,
        userId,
        canceledAt: null,
        startsAt: { [Op.gt]: now },
      },
      transaction,
    },
  );
}
