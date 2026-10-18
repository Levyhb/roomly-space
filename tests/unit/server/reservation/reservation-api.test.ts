import { GET as getAvailability } from "@/app/api/rooms/[roomId]/availability/route";
import { POST as postReservation } from "@/app/api/reservations/route";
import { requireUser } from "@/server/auth/session";
import { ApiError } from "@/server/http/api-error";
import {
  createReservation,
  getRoomAvailability,
} from "@/server/services/reservation-service";
import { makeReservationInput } from "../../../helpers/factories/reservation-factory";

jest.mock("@/server/auth/session", () => ({ requireUser: jest.fn() }));
jest.mock("@/server/services/reservation-service", () => ({
  createReservation: jest.fn(),
  getRoomAvailability: jest.fn(),
}));

const user = jest.mocked(requireUser);
const create = jest.mocked(createReservation);
const availability = jest.mocked(getRoomAvailability);

function reservationRequest(body: unknown): Request {
  return new Request("http://localhost/api/reservations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function availabilityRequest(roomId: string, date: string, extraQuery = "") {
  return getAvailability(
    new Request(
      `http://localhost/api/rooms/${roomId}/availability?date=${date}${extraQuery}`,
    ),
    { params: Promise.resolve({ roomId }) },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  user.mockResolvedValue({ id: 2, role: "USER" } as Awaited<
    ReturnType<typeof requireUser>
  >);
  availability.mockResolvedValue({
    roomId: 1,
    date: "2030-10-20",
    timezone: "America/Sao_Paulo",
    unavailable: [],
  });
  create.mockResolvedValue({
    id: 7,
    roomId: 1,
    date: "2030-10-20",
    startTime: "10:00",
    endTime: "11:00",
    startsAt: "2030-10-20T13:00:00.000Z",
    endsAt: "2030-10-20T14:00:00.000Z",
  });
});

test("TC_SALA_2_013 - GET disponibilidade é público e retorna somente intervalos", async () => {
  const response = await availabilityRequest("1", "2030-10-20");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    roomId: 1,
    date: "2030-10-20",
    timezone: "America/Sao_Paulo",
    unavailable: [],
  });
  expect(availability).toHaveBeenCalledWith(1, "2030-10-20");
  expect(user).not.toHaveBeenCalled();
});

test("TC_SALA_2_014 - GET rejeita ID, data, chave extra e data duplicada", async () => {
  for (const [roomId, date, extraQuery] of [
    ["0", "2030-10-20", ""],
    ["1", "2030-02-30", ""],
    ["abc", "2030-10-20", ""],
    ["1", "2030-10-20", "&unexpected=1"],
    ["1", "2030-10-20", "&date=2030-10-21"],
  ]) {
    const response = await availabilityRequest(roomId, date, extraQuery);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "INVALID_INPUT", message: "Dados inválidos" },
    });
  }
  expect(availability).not.toHaveBeenCalled();
});

test("TC_SALA_2_015 - POST sem sessão retorna 401 sem criar reserva", async () => {
  user.mockRejectedValueOnce(
    new ApiError(401, "UNAUTHORIZED", "Sessão ausente ou inválida"),
  );
  const response = await postReservation(
    reservationRequest(makeReservationInput()),
  );
  expect(response.status).toBe(401);
  expect(create).not.toHaveBeenCalled();
});

test("TC_SALA_2_016 - POST rejeita userId e horários fora de HH:mm", async () => {
  for (const body of [
    { ...makeReservationInput(), userId: 99 },
    makeReservationInput({ startTime: "9:00" }),
    makeReservationInput({ endTime: "24:00" }),
    makeReservationInput({ date: "2030-02-30" }),
  ]) {
    const response = await postReservation(reservationRequest(body));
    expect(response.status).toBe(400);
  }
  expect(create).not.toHaveBeenCalled();
});

test("TC_SALA_2_017 - POST usa ID da sessão para USER e ADMIN", async () => {
  for (const role of ["USER", "ADMIN"] as const) {
    user.mockResolvedValueOnce({ id: 2, role } as Awaited<
      ReturnType<typeof requireUser>
    >);
    const response = await postReservation(
      reservationRequest(makeReservationInput()),
    );
    expect(response.status).toBe(201);
    expect((await response.json()).reservation).toMatchObject({
      id: 7,
      roomId: 1,
    });
    expect(create).toHaveBeenLastCalledWith(makeReservationInput(), 2);
  }
});

test("TC_SALA_2_018 - controller preserva 404 e 409 do serviço", async () => {
  availability.mockRejectedValueOnce(
    new ApiError(404, "ROOM_NOT_FOUND", "Sala não encontrada"),
  );
  expect((await availabilityRequest("99", "2030-10-20")).status).toBe(404);

  create.mockRejectedValueOnce(
    new ApiError(409, "RESERVATION_CONFLICT", "Horário indisponível"),
  );
  const response = await postReservation(
    reservationRequest(makeReservationInput()),
  );
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({
    error: { code: "RESERVATION_CONFLICT", message: "Horário indisponível" },
  });
});
