import { GET as getRooms } from "@/app/api/rooms/route";
import { GET as getResources } from "@/app/api/resources/route";
import {
  findResources,
  findRooms,
} from "@/server/repositories/room-repository";
import { getRoomCatalog } from "@/server/services/room-service";

jest.mock("@/server/repositories/room-repository", () => ({
  findRooms: jest.fn(),
  findResources: jest.fn(),
}));

const mockedFindRooms = jest.mocked(findRooms);
const mockedFindResources = jest.mocked(findResources);

beforeEach(() => {
  mockedFindRooms.mockResolvedValue({ rows: [], count: 0 });
  mockedFindResources.mockResolvedValue([]);
});

test("TC_SALA_1_001 - aplica busca por nome no catálogo", async () => {
  await getRooms(new Request("http://localhost/api/rooms?q=Ip%C3%AA"));

  expect(mockedFindRooms).toHaveBeenCalledWith(
    expect.objectContaining({ q: "Ipê", page: 1, pageSize: 12 }),
  );
});

test("TC_SALA_1_002 - traduz faixas de capacidade com limites inclusivos", async () => {
  const ranges = [
    ["2-4", 2, 4],
    ["5-8", 5, 8],
    ["9-12", 9, 12],
    ["13-plus", 13, undefined],
  ] as const;

  for (const [capacity, minCapacity, maxCapacity] of ranges) {
    await getRoomCatalog({ capacity, page: 1 });
    expect(mockedFindRooms).toHaveBeenLastCalledWith(
      expect.objectContaining({ minCapacity, maxCapacity }),
    );
  }
});

test("TC_SALA_1_003 - encaminha o recurso solicitado ao repository", async () => {
  await getRooms(new Request("http://localhost/api/rooms?resource=projector"));

  expect(mockedFindRooms).toHaveBeenCalledWith(
    expect.objectContaining({ resource: "projector" }),
  );
});

test("TC_SALA_1_004 - combina busca, capacidade, recurso e página", async () => {
  await getRooms(
    new Request(
      "http://localhost/api/rooms?q=Sala&capacity=5-8&resource=video&page=2",
    ),
  );

  expect(mockedFindRooms).toHaveBeenCalledWith({
    q: "Sala",
    minCapacity: 5,
    maxCapacity: 8,
    resource: "video",
    page: 2,
    pageSize: 12,
  });
});

test("TC_SALA_1_005 - informa totais e página no retorno", async () => {
  mockedFindRooms.mockResolvedValueOnce({ rows: [], count: 13 });

  const response = await getRooms(
    new Request("http://localhost/api/rooms?page=2"),
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    items: [],
    pagination: { page: 2, pageSize: 12, totalItems: 13, totalPages: 2 },
  });
});

test("TC_SALA_1_006 - rejeita filtros e página inválidos", async () => {
  for (const query of ["capacity=1-4", "page=0", "resource=INVALIDO"]) {
    const response = await getRooms(
      new Request(`http://localhost/api/rooms?${query}`),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "INVALID_INPUT", message: "Dados inválidos" },
    });
  }
  expect(mockedFindRooms).not.toHaveBeenCalled();
});

test("TC_SALA_1_007 - permite consultar salas sem sessão", async () => {
  const response = await getRooms(new Request("http://localhost/api/rooms"));

  expect(response.status).toBe(200);
  expect(mockedFindRooms).toHaveBeenCalledTimes(1);
});

test("TC_SALA_1_008 - lista recursos públicos do banco", async () => {
  mockedFindResources.mockResolvedValueOnce([
    { id: 1, code: "projector", name: "Projetor" },
  ] as Awaited<ReturnType<typeof findResources>>);

  const response = await getResources();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    items: [{ id: 1, code: "projector", name: "Projetor" }],
  });
});

test("TC_SALA_6_002 - catálogo expõe a duração máxima configurada na sala", async () => {
  mockedFindRooms.mockResolvedValueOnce({
    count: 1,
    rows: [
      {
        id: 1,
        name: "Ipê",
        address: "Torre A",
        complement: null,
        description: "Sala compacta",
        capacity: 4,
        imageUrl: null,
        maxReservationDurationMinutes: 60,
        resources: [],
      },
    ],
  } as unknown as Awaited<ReturnType<typeof findRooms>>);

  const response = await getRoomCatalog({ page: 1 });

  expect(response.items[0]).toMatchObject({
    id: 1,
    maxReservationDurationMinutes: 60,
  });
});

test("TC_SALA_1_012 - recebe caracteres especiais da busca como texto", async () => {
  const response = await getRooms(
    new Request("http://localhost/api/rooms?q=%25_%5C"),
  );

  expect(response.status).toBe(200);
  expect(mockedFindRooms).toHaveBeenCalledWith(
    expect.objectContaining({ q: "%_\\" }),
  );
});
