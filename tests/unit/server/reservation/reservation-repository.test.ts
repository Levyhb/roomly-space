import { Op, Transaction } from "sequelize";
import { Reservation, sequelize } from "@/server/db/models";
import {
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
        startsAt: { [Op.lt]: end },
        endsAt: { [Op.gt]: start },
      },
    }),
  );
  findAll.mockRestore();
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
