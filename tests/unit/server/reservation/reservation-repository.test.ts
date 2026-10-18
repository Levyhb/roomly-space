import { Op, Transaction } from "sequelize";
import { Reservation, Room, sequelize } from "@/server/db/models";
import {
  findOwnReservations,
  markReservationCanceled,
  findOverlappingReservation,
  findReservationsInRange,
  withImmediateTransaction,
} from "@/server/repositories/reservation-repository";

test("TC_SALA_2_010 - consulta conflito com desigualdades estritas e sala isolada", async () => {
  const findOne = jest
    .spyOn(Reservation, "findOne")
    .mockResolvedValueOnce(null);
  const start = new Date("2030-10-20T13:00:00.000Z");
  const end = new Date("2030-10-20T14:00:00.000Z");
  const transaction = {} as Transaction;

  await findOverlappingReservation(1, start, end, transaction);

  expect(findOne).toHaveBeenCalledWith({
    where: {
      roomId: 1,
      canceledAt: null,
      startsAt: { [Op.lt]: end },
      endsAt: { [Op.gt]: start },
    },
    transaction,
  });
  findOne.mockRestore();
});

test("TC_SALA_2_011 - disponibilidade consulta apenas intervalos do dia", async () => {
  const findAll = jest.spyOn(Reservation, "findAll").mockResolvedValueOnce([]);
  const start = new Date("2030-10-20T03:00:00.000Z");
  const end = new Date("2030-10-21T03:00:00.000Z");

  await findReservationsInRange(1, start, end);
  expect(findAll).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        roomId: 1,
        canceledAt: null,
        startsAt: { [Op.lt]: end },
        endsAt: { [Op.gt]: start },
      },
    }),
  );
  findAll.mockRestore();
});

test("TC_SALA_3_001 - listagem restringe usuário, canceladas, filtro e página", async () => {
  const find = jest
    .spyOn(Reservation, "findAndCountAll")
    .mockResolvedValueOnce({ rows: [], count: 0 } as never);
  const now = new Date("2030-10-20T12:00:00.000Z");
  await findOwnReservations({
    userId: 2,
    q: "",
    status: "active",
    page: 3,
    now,
  });
  expect(find).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { userId: 2, canceledAt: null, endsAt: { [Op.gt]: now } },
      limit: 10,
      offset: 20,
      order: [
        ["startsAt", "ASC"],
        ["id", "ASC"],
      ],
    }),
  );
  find.mockRestore();
});

test("TC_SALA_3_002 - busca literal de sala limita IDs sem interpolar SQL", async () => {
  const rooms = jest
    .spyOn(Room, "findAll")
    .mockResolvedValueOnce([{ id: 8 }] as never);
  const find = jest
    .spyOn(Reservation, "findAndCountAll")
    .mockResolvedValueOnce({ rows: [], count: 0 } as never);
  await findOwnReservations({
    userId: 2,
    q: "%_",
    status: "completed",
    page: 1,
    now: new Date("2030-10-20T12:00:00.000Z"),
  });
  expect(rooms).toHaveBeenCalledWith(
    expect.objectContaining({ attributes: ["id"] }),
  );
  expect(find).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        userId: 2,
        canceledAt: null,
        roomId: { [Op.in]: [8] },
        endsAt: { [Op.lte]: expect.any(Date) },
      }),
      order: [
        ["endsAt", "DESC"],
        ["id", "ASC"],
      ],
    }),
  );
  rooms.mockRestore();
  find.mockRestore();
});

test("TC_SALA_3_003 - cancelamento condiciona dono, futuro e não cancelada", async () => {
  const update = jest.spyOn(Reservation, "update").mockResolvedValueOnce([1]);
  const now = new Date("2030-10-20T12:00:00.000Z");
  const transaction = {} as Transaction;
  await markReservationCanceled(4, 2, now, transaction);
  expect(update).toHaveBeenCalledWith(
    { canceledAt: now },
    {
      where: { id: 4, userId: 2, canceledAt: null, startsAt: { [Op.gt]: now } },
      transaction,
    },
  );
  update.mockRestore();
});

test("TC_SALA_2_012 - usa transação SQLite IMMEDIATE", async () => {
  const transaction = jest
    .spyOn(sequelize, "transaction")
    .mockResolvedValueOnce(5 as never);
  await withImmediateTransaction(async () => 5);
  expect(transaction).toHaveBeenCalledWith(
    { type: Transaction.TYPES.IMMEDIATE },
    expect.any(Function),
  );
  transaction.mockRestore();
});
