import {
  countExistingResources,
  findAdminRoomById,
  findAdminRoomWithResources,
  findAllRoomNames,
  insertAdminRoom,
  replaceRoomResources,
  updateAdminRoom,
  withAdminRoomTransaction,
} from "@/server/repositories/admin-room-repository";
import { findRooms } from "@/server/repositories/room-repository";
import {
  createAdminRoom,
  editAdminRoom,
  listAdminRooms,
} from "@/server/services/admin-room-service";

jest.mock("@/server/repositories/admin-room-repository", () => ({
  countExistingResources: jest.fn(),
  findAdminRoomById: jest.fn(),
  findAdminRoomWithResources: jest.fn(),
  findAllRoomNames: jest.fn(),
  insertAdminRoom: jest.fn(),
  replaceRoomResources: jest.fn(),
  updateAdminRoom: jest.fn(),
  withAdminRoomTransaction: jest.fn(),
}));
jest.mock("@/server/repositories/room-repository", () => ({
  findRooms: jest.fn(),
}));

const transaction = jest.mocked(withAdminRoomTransaction);
const names = jest.mocked(findAllRoomNames);
const countResources = jest.mocked(countExistingResources);
const insert = jest.mocked(insertAdminRoom);
const update = jest.mocked(updateAdminRoom);
const replace = jest.mocked(replaceRoomResources);
const byId = jest.mocked(findAdminRoomById);
const withResources = jest.mocked(findAdminRoomWithResources);
const find = jest.mocked(findRooms);
const input = {
  name: "Sala Nova",
  description: "Descrição",
  capacity: 8,
  address: "Torre A",
  complement: "Sala 5",
  resourceIds: [1, 3],
};
const room = {
  id: 9,
  ...input,
  imageUrl: "/old.png",
  resources: [{ id: 1 }, { id: 3 }],
};

beforeEach(() => {
  jest.clearAllMocks();
  transaction.mockImplementation((work) =>
    work({} as Parameters<typeof work>[0]),
  );
  names.mockResolvedValue([]);
  countResources.mockResolvedValue(2);
  insert.mockResolvedValue(
    room as unknown as Awaited<ReturnType<typeof insert>>,
  );
  update.mockResolvedValue(
    room as unknown as Awaited<ReturnType<typeof update>>,
  );
  byId.mockResolvedValue(room as unknown as Awaited<ReturnType<typeof byId>>);
  withResources.mockResolvedValue(
    room as unknown as Awaited<ReturnType<typeof withResources>>,
  );
  replace.mockResolvedValue();
  find.mockResolvedValue({ count: 0, rows: [] });
});

test("TC_SALA_4_007 - listagem usa filtros combinados, ordem do repository e limite 10", async () => {
  find.mockResolvedValueOnce({ count: 21, rows: [room] } as unknown as Awaited<
    ReturnType<typeof find>
  >);
  const response = await listAdminRooms({
    q: "Sala",
    capacity: "5-8",
    resource: "video",
    page: 2,
  });
  expect(find).toHaveBeenCalledWith({
    q: "Sala",
    minCapacity: 5,
    maxCapacity: 8,
    resource: "video",
    page: 2,
    pageSize: 10,
  });
  expect(response.pagination).toEqual({
    page: 2,
    pageSize: 10,
    totalItems: 21,
    totalPages: 3,
  });
  expect(response.items[0]).toMatchObject({
    id: 9,
    complement: "Sala 5",
    resourceIds: [1, 3],
  });
});

test("TC_SALA_4_008 - criação valida referências e persiste sala e vínculos na mesma transação", async () => {
  const output = await createAdminRoom(input);
  expect(insert).toHaveBeenCalledWith(input, expect.anything());
  expect(replace).toHaveBeenCalledWith(9, [1, 3], expect.anything());
  expect(insert.mock.calls[0][1]).toBe(replace.mock.calls[0][2]);
  expect(output).toMatchObject({ id: 9, resourceIds: [1, 3] });
});

test("TC_SALA_4_009 - nome duplicado ignora caixa, inclusive acentos", async () => {
  names.mockResolvedValueOnce([{ id: 2, name: "ÁRVORE" }] as Awaited<
    ReturnType<typeof names>
  >);
  await expect(
    createAdminRoom({ ...input, name: "árvore" }),
  ).rejects.toMatchObject({ status: 409, code: "ROOM_NAME_CONFLICT" });
  expect(insert).not.toHaveBeenCalled();
});

test("TC_SALA_4_010 - recurso inexistente rejeita antes de persistir", async () => {
  countResources.mockResolvedValueOnce(1);
  await expect(createAdminRoom(input)).rejects.toMatchObject({ status: 400 });
  expect(insert).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
});

test("TC_SALA_4_011 - edição substitui vínculos e preserva imagem existente", async () => {
  await editAdminRoom(9, input);
  expect(update).toHaveBeenCalledWith(room, input, expect.anything());
  expect(update.mock.calls[0][2]).toBe(replace.mock.calls[0][2]);
  expect(replace).toHaveBeenCalledWith(9, [1, 3], expect.anything());
  expect(update.mock.calls[0][1]).not.toHaveProperty("imageUrl");
});

test("TC_SALA_4_012 - edição inexistente retorna 404 sem escrita", async () => {
  byId.mockResolvedValueOnce(null);
  await expect(editAdminRoom(99, input)).rejects.toMatchObject({ status: 404 });
  expect(update).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
});

test("TC_SALA_4_013 - criação sem recursos e complemento é aceita", async () => {
  await createAdminRoom({ ...input, complement: null, resourceIds: [] });
  expect(countResources).not.toHaveBeenCalled();
  expect(replace).toHaveBeenCalledWith(9, [], expect.anything());
});
