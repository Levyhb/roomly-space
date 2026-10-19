import {
  findOwnReservationById,
  findOwnReservations,
  markReservationCanceled,
  withImmediateTransaction,
} from "@/server/repositories/reservation-repository";
import {
  cancelOwnReservation,
  listOwnReservations,
} from "@/server/services/own-reservation-service";

jest.mock("@/server/repositories/reservation-repository", () => ({
  findOwnReservations: jest.fn(),
  findOwnReservationById: jest.fn(),
  markReservationCanceled: jest.fn(),
  withImmediateTransaction: jest.fn(),
}));

const find = jest.mocked(findOwnReservations);
const findById = jest.mocked(findOwnReservationById);
const markCanceled = jest.mocked(markReservationCanceled);
const transaction = jest.mocked(withImmediateTransaction);
const now = new Date("2030-10-20T12:00:00.000Z");
const clock = () => now;
const input = { q: "", status: "all" as const, page: 1 };

function reservation(id: number, start: string, end: string) {
  return {
    id,
    startsAt: new Date(start),
    endsAt: new Date(end),
    room: {
      id: 5,
      name: "Sala Ipê",
      address: "Torre A",
      complement: null,
      capacity: 8,
      imageUrl: null,
    },
  } as Awaited<ReturnType<typeof findById>> & { room: object };
}

beforeEach(() => {
  jest.clearAllMocks();
  transaction.mockImplementation((work) =>
    work({} as Parameters<typeof work>[0]),
  );
  markCanceled.mockResolvedValue([1]);
});

test("TC_SALA_3_004 - status calcula fronteiras pelo mesmo relógio do filtro", async () => {
  find.mockResolvedValueOnce({
    count: 3,
    rows: [
      reservation(1, "2030-10-20T12:00:01.000Z", "2030-10-20T13:00:00.000Z"),
      reservation(2, "2030-10-20T12:00:00.000Z", "2030-10-20T13:00:00.000Z"),
      reservation(3, "2030-10-20T11:00:00.000Z", "2030-10-20T12:00:00.000Z"),
    ],
  } as Awaited<ReturnType<typeof find>>);
  const result = await listOwnReservations(2, input, clock);
  expect(find).toHaveBeenCalledWith({ userId: 2, ...input, now });
  expect(result.items.map((item) => item.status)).toEqual([
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
  ]);
  expect(result.items[0].room).toEqual({
    id: 5,
    name: "Sala Ipê",
    address: "Torre A",
    complement: null,
    capacity: 8,
    imageUrl: null,
  });
  expect(result.pagination).toEqual({
    page: 1,
    pageSize: 10,
    totalItems: 3,
    totalPages: 1,
  });
});

test("TC_SALA_3_005 - reserva alheia ou inexistente retorna 404 sem atualizar", async () => {
  findById.mockResolvedValueOnce(null);
  await expect(cancelOwnReservation(8, 2, clock)).rejects.toMatchObject({
    status: 404,
    code: "RESERVATION_NOT_FOUND",
  });
  expect(findById).toHaveBeenCalledWith(8, 2, expect.anything());
  expect(markCanceled).not.toHaveBeenCalled();
});

test("TC_SALA_3_006 - apenas futura própria não cancelada pode ser cancelada", async () => {
  for (const entry of [
    {
      ...reservation(8, "2030-10-20T11:00:00.000Z", "2030-10-20T13:00:00.000Z"),
      canceledAt: null,
    },
    {
      ...reservation(8, "2030-10-20T12:00:00.000Z", "2030-10-20T13:00:00.000Z"),
      canceledAt: null,
    },
    {
      ...reservation(8, "2030-10-20T13:00:00.000Z", "2030-10-20T14:00:00.000Z"),
      canceledAt: now,
    },
  ]) {
    findById.mockResolvedValueOnce(
      entry as Awaited<ReturnType<typeof findById>>,
    );
    await expect(cancelOwnReservation(8, 2, clock)).rejects.toMatchObject({
      status: 409,
      code: "CANCELLATION_CONFLICT",
    });
  }
  expect(markCanceled).not.toHaveBeenCalled();
});

test("TC_SALA_3_007 - cancelamento usa atualização condicional e exige uma linha", async () => {
  findById.mockResolvedValueOnce({
    ...reservation(8, "2030-10-20T13:00:00.000Z", "2030-10-20T14:00:00.000Z"),
    canceledAt: null,
  } as Awaited<ReturnType<typeof findById>>);
  await expect(cancelOwnReservation(8, 2, clock)).resolves.toBeUndefined();
  expect(markCanceled).toHaveBeenCalledWith(8, 2, now, expect.anything());
  findById.mockResolvedValueOnce({
    ...reservation(8, "2030-10-20T13:00:00.000Z", "2030-10-20T14:00:00.000Z"),
    canceledAt: null,
  } as Awaited<ReturnType<typeof findById>>);
  markCanceled.mockResolvedValueOnce([0]);
  await expect(cancelOwnReservation(8, 2, clock)).rejects.toMatchObject({
    status: 409,
  });
});

test("TC_SALA_3_008 - contenção SQLite retorna conflito controlado", async () => {
  transaction.mockRejectedValueOnce({ parent: { code: "SQLITE_BUSY" } });
  await expect(cancelOwnReservation(8, 2, clock)).rejects.toMatchObject({
    status: 409,
    code: "CANCELLATION_CONFLICT",
  });
});
