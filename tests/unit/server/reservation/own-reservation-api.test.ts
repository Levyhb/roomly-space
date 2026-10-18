import { GET } from "@/app/api/reservations/route";
import { PATCH } from "@/app/api/reservations/[reservationId]/cancel/route";
import { requireUser } from "@/server/auth/session";
import { ApiError } from "@/server/http/api-error";
import {
  cancelOwnReservation,
  listOwnReservations,
} from "@/server/services/own-reservation-service";

jest.mock("@/server/auth/session", () => ({ requireUser: jest.fn() }));
jest.mock("@/server/services/own-reservation-service", () => ({
  listOwnReservations: jest.fn(),
  cancelOwnReservation: jest.fn(),
}));

const user = jest.mocked(requireUser);
const list = jest.mocked(listOwnReservations);
const cancel = jest.mocked(cancelOwnReservation);

beforeEach(() => {
  jest.clearAllMocks();
  user.mockResolvedValue({ id: 2, role: "USER" } as Awaited<
    ReturnType<typeof requireUser>
  >);
  list.mockResolvedValue({
    items: [],
    pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
  });
  cancel.mockResolvedValue();
});

test("TC_SALA_3_009 - GET exige sessão e usa ID exclusivo do cookie", async () => {
  const response = await GET(
    new Request(
      "http://localhost/api/reservations?q=Ip%C3%AA&status=all&page=2",
    ),
  );
  expect(response.status).toBe(200);
  expect(list).toHaveBeenCalledWith(2, { q: "Ipê", status: "all", page: 2 });
  user.mockRejectedValueOnce(
    new ApiError(401, "UNAUTHORIZED", "Sessão ausente"),
  );
  expect(
    (await GET(new Request("http://localhost/api/reservations"))).status,
  ).toBe(401);
  expect(list).toHaveBeenCalledTimes(1);
});

test("TC_SALA_3_010 - GET rejeita query inválida, duplicada e userId", async () => {
  for (const query of [
    "?status=other",
    "?page=0",
    "?page=1&page=2",
    "?userId=3",
    "?q=a&q=b",
  ]) {
    const response = await GET(
      new Request(`http://localhost/api/reservations${query}`),
    );
    expect(response.status).toBe(400);
  }
  expect(list).not.toHaveBeenCalled();
});

test("TC_SALA_3_011 - PATCH valida ID e autenticação antes de cancelar", async () => {
  const context = (reservationId: string) => ({
    params: Promise.resolve({ reservationId }),
  });
  const request = new Request("http://localhost/api/reservations/4/cancel", {
    method: "PATCH",
  });
  expect((await PATCH(request, context("0"))).status).toBe(400);
  expect((await PATCH(request, context("abc"))).status).toBe(400);
  expect(cancel).not.toHaveBeenCalled();
  user.mockRejectedValueOnce(
    new ApiError(401, "UNAUTHORIZED", "Sessão ausente"),
  );
  expect((await PATCH(request, context("4"))).status).toBe(401);
  expect(cancel).not.toHaveBeenCalled();
});

test("TC_SALA_3_012 - PATCH retorna 204 vazio e preserva 404/409", async () => {
  const request = new Request("http://localhost/api/reservations/4/cancel", {
    method: "PATCH",
  });
  const context = { params: Promise.resolve({ reservationId: "4" }) };
  const success = await PATCH(request, context);
  expect(success.status).toBe(204);
  expect(await success.text()).toBe("");
  expect(cancel).toHaveBeenCalledWith(4, 2);
  cancel.mockRejectedValueOnce(
    new ApiError(404, "RESERVATION_NOT_FOUND", "Reserva não encontrada"),
  );
  expect((await PATCH(request, context)).status).toBe(404);
  cancel.mockRejectedValueOnce(
    new ApiError(
      409,
      "CANCELLATION_CONFLICT",
      "Reserva não pode ser cancelada",
    ),
  );
  expect((await PATCH(request, context)).status).toBe(409);
});

test("TC_SALA_3_013 - PATCH rejeita qualquer query ou corpo antes do serviço", async () => {
  const context = { params: Promise.resolve({ reservationId: "4" }) };
  const requests = [
    new Request("http://localhost/api/reservations/4/cancel?userId=9", {
      method: "PATCH",
    }),
    new Request("http://localhost/api/reservations/4/cancel?unexpected=1", {
      method: "PATCH",
    }),
    new Request("http://localhost/api/reservations/4/cancel", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: 9 }),
    }),
    new Request("http://localhost/api/reservations/4/cancel", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: "{}",
    }),
    new Request("http://localhost/api/reservations/4/cancel", {
      method: "PATCH",
      body: " ",
    }),
  ];
  for (const request of requests) {
    const response = await PATCH(request, context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "INVALID_INPUT",
        message: "Cancelamento não aceita parâmetros nem corpo",
      },
    });
  }
  expect(cancel).not.toHaveBeenCalled();
});
