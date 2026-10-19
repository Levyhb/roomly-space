import {
  findOverlappingReservation,
  findReservationsInRange,
  findRoomById,
  insertReservation,
  withImmediateTransaction,
} from "@/server/repositories/reservation-repository";
import {
  createReservation,
  getRoomAvailability,
} from "@/server/services/reservation-service";
import { makeReservationInput } from "../../../helpers/factories/reservation-factory";

jest.mock("@/server/repositories/reservation-repository", () => ({
  findRoomById: jest.fn(),
  findReservationsInRange: jest.fn(),
  findOverlappingReservation: jest.fn(),
  insertReservation: jest.fn(),
  withImmediateTransaction: jest.fn(),
}));

const room = jest.mocked(findRoomById);
const inRange = jest.mocked(findReservationsInRange);
const overlapping = jest.mocked(findOverlappingReservation);
const insert = jest.mocked(insertReservation);
const transaction = jest.mocked(withImmediateTransaction);
const fixedNow = () => new Date("2030-10-19T12:00:00.000Z");

beforeEach(() => {
  jest.clearAllMocks();
  room.mockResolvedValue({ id: 1 } as Awaited<ReturnType<typeof findRoomById>>);
  inRange.mockResolvedValue([]);
  overlapping.mockResolvedValue(null);
  insert.mockResolvedValue({ id: 7, roomId: 1 } as Awaited<
    ReturnType<typeof insertReservation>
  >);
  transaction.mockImplementation((work) =>
    work({} as Parameters<typeof work>[0]),
  );
});

test("TC_SALA_2_001 - disponibilidade pública contém só horários da sala e dia", async () => {
  inRange.mockResolvedValueOnce([
    {
      startsAt: new Date("2030-10-21T13:00:00.000Z"),
      endsAt: new Date("2030-10-21T14:00:00.000Z"),
      userId: 9,
    },
  ] as Awaited<ReturnType<typeof findReservationsInRange>>);
  const result = await getRoomAvailability(1, "2030-10-21");

  expect(inRange).toHaveBeenCalledWith(
    1,
    new Date("2030-10-21T03:00:00.000Z"),
    new Date("2030-10-22T03:00:00.000Z"),
  );
  expect(result).toEqual({
    roomId: 1,
    date: "2030-10-21",
    timezone: "America/Sao_Paulo",
    unavailable: [{ startTime: "10:00", endTime: "11:00" }],
  });
  expect(JSON.stringify(result)).not.toContain("userId");
});

test("TC_SALA_2_002 - persiste UTC e usa usuário recebido da sessão", async () => {
  const result = await createReservation(makeReservationInput(), 3, fixedNow);

  expect(transaction).toHaveBeenCalledTimes(1);
  expect(overlapping).toHaveBeenCalledWith(
    1,
    new Date("2030-10-21T13:00:00.000Z"),
    new Date("2030-10-21T14:00:00.000Z"),
    expect.anything(),
  );
  expect(insert).toHaveBeenCalledWith(
    {
      userId: 3,
      roomId: 1,
      startsAt: new Date("2030-10-21T13:00:00.000Z"),
      endsAt: new Date("2030-10-21T14:00:00.000Z"),
    },
    expect.anything(),
  );
  expect(result).toMatchObject({
    id: 7,
    roomId: 1,
    startsAt: "2030-10-21T13:00:00.000Z",
    endsAt: "2030-10-21T14:00:00.000Z",
  });
});

test("TC_SALA_2_003 - aceita limites inclusivos de 15 e 240 minutos", async () => {
  await createReservation(
    makeReservationInput({ endTime: "10:15" }),
    3,
    fixedNow,
  );
  await createReservation(
    makeReservationInput({ endTime: "14:00" }),
    3,
    fixedNow,
  );
  expect(insert).toHaveBeenCalledTimes(2);
});

test("TC_SALA_2_004 - rejeita 14 e 241 minutos antes de consultar banco", async () => {
  for (const endTime of ["10:14", "14:01"]) {
    await expect(
      createReservation(makeReservationInput({ endTime }), 3, fixedNow),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_DURATION" });
  }
  expect(room).not.toHaveBeenCalled();
  expect(insert).not.toHaveBeenCalled();
});

test("TC_SALA_2_005 - rejeita início passado ou igual ao instante atual", async () => {
  for (const [date, startTime] of [
    ["2030-10-18", "10:00"],
    ["2030-10-19", "09:00"],
  ]) {
    await expect(
      createReservation(makeReservationInput({ date, startTime }), 3, fixedNow),
    ).rejects.toMatchObject({ status: 400, code: "PAST_RESERVATION" });
  }
  expect(insert).not.toHaveBeenCalled();
});

test("TC_SALA_2_006 - rejeita ordem igual ou invertida e horário que cruzaria meia-noite", async () => {
  for (const [startTime, endTime] of [
    ["10:00", "10:00"],
    ["11:00", "10:00"],
    ["23:50", "00:10"],
  ]) {
    await expect(
      createReservation(
        makeReservationInput({ startTime, endTime }),
        3,
        fixedNow,
      ),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_DURATION" });
  }
  expect(insert).not.toHaveBeenCalled();
});

test("TC_SALA_2_007 - conflito impede inserção e adjacência é aceita", async () => {
  overlapping.mockResolvedValueOnce({ id: 1 } as Awaited<
    ReturnType<typeof findOverlappingReservation>
  >);
  await expect(
    createReservation(makeReservationInput(), 3, fixedNow),
  ).rejects.toMatchObject({ status: 409, code: "RESERVATION_CONFLICT" });
  expect(insert).not.toHaveBeenCalled();
  await createReservation(
    makeReservationInput({ startTime: "11:00", endTime: "12:00" }),
    3,
    fixedNow,
  );
  expect(insert).toHaveBeenCalledTimes(1);
});

test("TC_SALA_2_019 - rejeita todas as posições de sobreposição e aceita bordas", async () => {
  const existingStart = new Date("2030-10-21T13:00:00.000Z").getTime();
  const existingEnd = new Date("2030-10-21T14:00:00.000Z").getTime();
  overlapping.mockImplementation(async (_, start, end) =>
    start.getTime() < existingEnd && end.getTime() > existingStart
      ? ({ id: 1 } as Awaited<ReturnType<typeof findOverlappingReservation>>)
      : null,
  );

  for (const [startTime, endTime] of [
    ["10:00", "11:00"], // mesmo intervalo
    ["09:30", "10:30"], // início parcial
    ["10:30", "11:30"], // fim parcial
    ["09:30", "11:30"], // contém a existente
    ["10:15", "10:45"], // contida na existente
  ]) {
    await expect(
      createReservation(
        makeReservationInput({ startTime, endTime }),
        3,
        fixedNow,
      ),
    ).rejects.toMatchObject({ status: 409, code: "RESERVATION_CONFLICT" });
  }
  for (const [startTime, endTime] of [
    ["09:00", "10:00"],
    ["11:00", "12:00"],
  ]) {
    await createReservation(
      makeReservationInput({ startTime, endTime }),
      3,
      fixedNow,
    );
  }
  expect(insert).toHaveBeenCalledTimes(2);
});

test("TC_SALA_5_001 - aceita dias úteis e os limites 08:00 e 20:00", async () => {
  for (const date of [
    "2030-10-21",
    "2030-10-22",
    "2030-10-23",
    "2030-10-24",
    "2030-10-25",
  ]) {
    await createReservation(makeReservationInput({ date }), 3, fixedNow);
  }
  await createReservation(
    makeReservationInput({ startTime: "08:00", endTime: "08:15" }),
    3,
    fixedNow,
  );
  await createReservation(
    makeReservationInput({ startTime: "19:45", endTime: "20:00" }),
    3,
    fixedNow,
  );
  expect(insert).toHaveBeenCalledTimes(7);
});

test("TC_SALA_5_002 - rejeita sábado e domingo antes de consultar a sala", async () => {
  for (const date of ["2030-10-20", "2030-10-26"]) {
    await expect(
      createReservation(makeReservationInput({ date }), 3, fixedNow),
    ).rejects.toMatchObject({ status: 400, code: "NON_BUSINESS_DAY" });
  }
  expect(room).not.toHaveBeenCalled();
  expect(insert).not.toHaveBeenCalled();
});

test("TC_SALA_5_003 - rejeita intervalos fora de 08:00 a 20:00", async () => {
  for (const [startTime, endTime] of [
    ["07:59", "08:15"],
    ["19:45", "20:01"],
  ]) {
    await expect(
      createReservation(
        makeReservationInput({ startTime, endTime }),
        3,
        fixedNow,
      ),
    ).rejects.toMatchObject({
      status: 400,
      code: "OUTSIDE_BUSINESS_HOURS",
    });
  }
  expect(room).not.toHaveBeenCalled();
  expect(insert).not.toHaveBeenCalled();
});

test("TC_SALA_2_021 - disponibilidade de sala inexistente responde 404", async () => {
  room.mockResolvedValueOnce(null);
  await expect(getRoomAvailability(99, "2030-10-21")).rejects.toMatchObject({
    status: 404,
    code: "ROOM_NOT_FOUND",
  });
  expect(inRange).not.toHaveBeenCalled();
});

test("TC_SALA_2_008 - sala inexistente responde 404 e não abre transação", async () => {
  room.mockResolvedValueOnce(null);
  await expect(
    createReservation(makeReservationInput(), 3, fixedNow),
  ).rejects.toMatchObject({ status: 404, code: "ROOM_NOT_FOUND" });
  expect(transaction).not.toHaveBeenCalled();
});

test("TC_SALA_2_009 - contenção SQLite recebe erro de conflito controlado", async () => {
  transaction.mockRejectedValueOnce({ parent: { code: "SQLITE_BUSY" } });
  await expect(
    createReservation(makeReservationInput(), 3, fixedNow),
  ).rejects.toMatchObject({ status: 409, code: "RESERVATION_CONFLICT" });
  expect(insert).not.toHaveBeenCalled();
});

test("TC_SALA_2_022 - SQLite_LOCKED também retorna conflito controlado", async () => {
  transaction.mockRejectedValueOnce({ original: { code: "SQLITE_LOCKED" } });
  await expect(
    createReservation(makeReservationInput(), 3, fixedNow),
  ).rejects.toMatchObject({ status: 409, code: "RESERVATION_CONFLICT" });
});
