import { GET, POST } from "@/app/api/admin/rooms/route";
import { PATCH } from "@/app/api/admin/rooms/[roomId]/route";
import { requireAdmin } from "@/server/auth/session";
import { ApiError } from "@/server/http/api-error";
import {
  createAdminRoom,
  editAdminRoom,
  listAdminRooms,
} from "@/server/services/admin-room-service";

jest.mock("@/server/auth/session", () => ({ requireAdmin: jest.fn() }));
jest.mock("@/server/services/admin-room-service", () => ({
  createAdminRoom: jest.fn(),
  editAdminRoom: jest.fn(),
  listAdminRooms: jest.fn(),
}));

const authorize = jest.mocked(requireAdmin);
const list = jest.mocked(listAdminRooms);
const create = jest.mocked(createAdminRoom);
const edit = jest.mocked(editAdminRoom);
const body = {
  name: "Sala Nova",
  description: "Descrição",
  capacity: 8,
  address: "Torre A",
  complement: "Sala 5",
  resourceIds: [1, 3],
};
const room = { id: 9, ...body, imageUrl: null };

function jsonRequest(path: string, method: "POST" | "PATCH", value: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  authorize.mockResolvedValue({ id: 3, role: "ADMIN" } as Awaited<
    ReturnType<typeof requireAdmin>
  >);
  list.mockResolvedValue({
    items: [],
    pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
  });
  create.mockResolvedValue(room);
  edit.mockResolvedValue(room);
});

test("TC_SALA_4_001 - todos os endpoints negam visitante e usuário comum", async () => {
  for (const error of [
    new ApiError(401, "UNAUTHORIZED", "Sessão ausente"),
    new ApiError(403, "FORBIDDEN", "Acesso não permitido"),
  ]) {
    authorize.mockRejectedValue(error);
    expect(
      (await GET(new Request("http://localhost/api/admin/rooms"))).status,
    ).toBe(error.status);
    expect(
      (await POST(jsonRequest("/api/admin/rooms", "POST", body))).status,
    ).toBe(error.status);
    expect(
      (
        await PATCH(jsonRequest("/api/admin/rooms/9", "PATCH", body), {
          params: Promise.resolve({ roomId: "9" }),
        })
      ).status,
    ).toBe(error.status);
  }
  expect(list).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
  expect(edit).not.toHaveBeenCalled();
});

test("TC_SALA_4_002 - GET combina filtros e pagina 10 itens", async () => {
  const response = await GET(
    new Request(
      "http://localhost/api/admin/rooms?q=Ip%C3%AA&capacity=5-8&resource=projector&page=2",
    ),
  );
  expect(response.status).toBe(200);
  expect(list).toHaveBeenCalledWith({
    q: "Ipê",
    capacity: "5-8",
    resource: "projector",
    page: 2,
  });
});

test("TC_SALA_4_003 - query estrita rejeita parâmetros extras e repetidos", async () => {
  for (const query of [
    "?page=0",
    "?page=1&page=2",
    "?role=ADMIN",
    "?capacity=0-1",
  ]) {
    expect(
      (await GET(new Request(`http://localhost/api/admin/rooms${query}`)))
        .status,
    ).toBe(400);
  }
  expect(list).not.toHaveBeenCalled();
});

test("TC_SALA_4_004 - POST e PATCH aceitam campos permitidos e respondem 201/200", async () => {
  const created = await POST(jsonRequest("/api/admin/rooms", "POST", body));
  expect(created.status).toBe(201);
  expect(await created.json()).toEqual({ room });
  expect(create).toHaveBeenCalledWith(body);
  const edited = await PATCH(jsonRequest("/api/admin/rooms/9", "PATCH", body), {
    params: Promise.resolve({ roomId: "9" }),
  });
  expect(edited.status).toBe(200);
  expect(edit).toHaveBeenCalledWith(9, body);
});

test("TC_SALA_4_005 - body estrito rejeita imagem, role, capacidade e recursos inválidos", async () => {
  for (const invalid of [
    { ...body, imageUrl: "/secret.png" },
    { ...body, role: "ADMIN" },
    { ...body, capacity: 0 },
    { ...body, capacity: 2.5 },
    { ...body, description: " " },
    { ...body, resourceIds: [1, 1] },
    { ...body, resourceIds: [0] },
  ]) {
    expect(
      (await POST(jsonRequest("/api/admin/rooms", "POST", invalid))).status,
    ).toBe(400);
  }
  expect(create).not.toHaveBeenCalled();
});

test("TC_SALA_4_006 - PATCH valida ID e preserva 404/409 do serviço", async () => {
  const context = (roomId: string) => ({ params: Promise.resolve({ roomId }) });
  expect(
    (
      await PATCH(
        jsonRequest("/api/admin/rooms/abc", "PATCH", body),
        context("abc"),
      )
    ).status,
  ).toBe(400);
  expect(edit).not.toHaveBeenCalled();
  edit.mockRejectedValueOnce(
    new ApiError(404, "ROOM_NOT_FOUND", "Sala não encontrada"),
  );
  expect(
    (
      await PATCH(
        jsonRequest("/api/admin/rooms/9", "PATCH", body),
        context("9"),
      )
    ).status,
  ).toBe(404);
  edit.mockRejectedValueOnce(
    new ApiError(409, "ROOM_NAME_CONFLICT", "Nome de sala já utilizado"),
  );
  expect(
    (
      await PATCH(
        jsonRequest("/api/admin/rooms/9", "PATCH", body),
        context("9"),
      )
    ).status,
  ).toBe(409);
});

test("TC_SALA_4_016 - POST e PATCH rejeitam qualquer query antes da escrita", async () => {
  const context = { params: Promise.resolve({ roomId: "9" }) };
  for (const query of ["?userId=1", "?role=ADMIN"]) {
    expect(
      (await POST(jsonRequest(`/api/admin/rooms${query}`, "POST", body)))
        .status,
    ).toBe(400);
    expect(
      (
        await PATCH(
          jsonRequest(`/api/admin/rooms/9${query}`, "PATCH", body),
          context,
        )
      ).status,
    ).toBe(400);
  }
  expect(create).not.toHaveBeenCalled();
  expect(edit).not.toHaveBeenCalled();

  authorize.mockRejectedValueOnce(
    new ApiError(401, "UNAUTHORIZED", "Sessão ausente"),
  );
  expect(
    (await POST(jsonRequest("/api/admin/rooms?role=ADMIN", "POST", body)))
      .status,
  ).toBe(401);
});
