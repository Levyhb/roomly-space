import { col, fn, Op, where as sqlWhere } from "sequelize";
import { Resource, Room, RoomResource } from "@/server/db/models";
import { findRooms } from "@/server/repositories/room-repository";

afterEach(() => jest.restoreAllMocks());

function substringNameCondition(query: string) {
  return sqlWhere(
    fn("instr", fn("lower", col("name")), query.toLocaleLowerCase("pt-BR")),
    { [Op.gt]: 0 },
  );
}

test("TC_SALA_1_009 - aplica busca e faixa inclusiva na consulta ordenada", async () => {
  const findAndCountAll = jest
    .spyOn(Room, "findAndCountAll")
    .mockResolvedValue({ rows: [], count: 0 } as never);

  await findRooms({
    q: "Ipê",
    minCapacity: 2,
    maxCapacity: 4,
    page: 2,
    pageSize: 12,
  });

  expect(findAndCountAll).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        [Op.and]: substringNameCondition("Ipê"),
        capacity: { [Op.between]: [2, 4] },
      },
      order: [
        ["name", "ASC"],
        ["id", "ASC"],
      ],
      limit: 12,
      offset: 12,
    }),
  );
});

test("TC_SALA_1_010 - restringe salas ao recurso junto com outros filtros", async () => {
  jest.spyOn(Resource, "findOne").mockResolvedValue({ id: 7 } as Resource);
  jest
    .spyOn(RoomResource, "findAll")
    .mockResolvedValue([{ roomId: 2 }] as RoomResource[]);
  const findAndCountAll = jest
    .spyOn(Room, "findAndCountAll")
    .mockResolvedValue({ rows: [], count: 0 } as never);

  await findRooms({
    q: "Ara",
    minCapacity: 5,
    maxCapacity: 8,
    resource: "projector",
    page: 1,
    pageSize: 12,
  });

  expect(Resource.findOne).toHaveBeenCalledWith({
    where: { code: "projector" },
  });
  expect(RoomResource.findAll).toHaveBeenCalledWith({
    where: { resourceId: 7 },
    attributes: ["roomId"],
  });
  expect(findAndCountAll).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        [Op.and]: substringNameCondition("Ara"),
        capacity: { [Op.between]: [5, 8] },
        id: { [Op.in]: [2] },
      },
    }),
  );
});

test("TC_SALA_1_011 - trata percent, underline e barra como texto literal", async () => {
  const findAndCountAll = jest
    .spyOn(Room, "findAndCountAll")
    .mockResolvedValue({ rows: [], count: 0 } as never);

  await findRooms({ q: "%_\\", page: 1, pageSize: 12 });

  expect(findAndCountAll).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        [Op.and]: substringNameCondition("%_\\"),
      },
    }),
  );
});

test("TC_SALA_1_013 - escapa aspas simples no termo de busca", async () => {
  const findAndCountAll = jest
    .spyOn(Room, "findAndCountAll")
    .mockResolvedValue({ rows: [], count: 0 } as never);

  await findRooms({ q: "O'Neil", page: 1, pageSize: 12 });

  expect(findAndCountAll).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        [Op.and]: substringNameCondition("O'Neil"),
      },
    }),
  );
});

test("TC_SALA_1_014 - pagina antes de incluir recursos sem depender do alias SQL", async () => {
  const plainRoom = { id: 1, name: "Ipê" } as Room;
  const hydratedRoom = {
    id: 1,
    name: "Ipê",
    resources: [{ code: "coffee", name: "Café" }],
  } as Room;
  const findAndCountAll = jest
    .spyOn(Room, "findAndCountAll")
    .mockResolvedValue({ rows: [plainRoom], count: 1 } as never);
  const findAll = jest.spyOn(Room, "findAll").mockResolvedValue([hydratedRoom]);

  const result = await findRooms({ q: "Ipê", page: 1, pageSize: 12 });

  expect(findAndCountAll.mock.calls[0][0]).not.toHaveProperty("include");
  expect(findAll).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: { [Op.in]: [1] } },
      include: [expect.objectContaining({ as: "resources" })],
    }),
  );
  expect(result).toEqual({ rows: [hydratedRoom], count: 1 });
});
