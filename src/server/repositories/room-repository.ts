import { col, fn, Op, where as sqlWhere } from "sequelize";
import type { WhereOptions } from "sequelize";
import { Resource, Room, RoomResource } from "@/server/db/models";

export type RoomSearch = {
  q?: string;
  minCapacity?: number;
  maxCapacity?: number;
  resource?: string;
  page: number;
  pageSize: number;
};

export async function findRooms(search: RoomSearch) {
  const where: WhereOptions<Room> = {};
  let nameCondition: ReturnType<typeof sqlWhere> | undefined;

  if (search.q) {
    nameCondition = sqlWhere(
      fn(
        "instr",
        fn("lower", col("name")),
        search.q.toLocaleLowerCase("pt-BR"),
      ),
      { [Op.gt]: 0 },
    );
  }
  if (search.minCapacity !== undefined) {
    where.capacity =
      search.maxCapacity === undefined
        ? { [Op.gte]: search.minCapacity }
        : { [Op.between]: [search.minCapacity, search.maxCapacity] };
  }
  if (search.resource) {
    const resource = await Resource.findOne({
      where: { code: search.resource },
    });
    if (!resource) {
      return { rows: [], count: 0 };
    }

    const links = await RoomResource.findAll({
      where: { resourceId: resource.id },
      attributes: ["roomId"],
    });
    where.id = { [Op.in]: links.map((link) => link.roomId) };
  }

  const result = await Room.findAndCountAll({
    where: nameCondition ? { ...where, [Op.and]: nameCondition } : where,
    order: [
      ["name", "ASC"],
      ["id", "ASC"],
    ],
    limit: search.pageSize,
    offset: (search.page - 1) * search.pageSize,
  });

  if (result.rows.length === 0) {
    return result;
  }

  const roomsWithResources = await Room.findAll({
    where: { id: { [Op.in]: result.rows.map((room) => room.id) } },
    include: [
      {
        model: Resource,
        as: "resources",
        attributes: ["code", "name"],
        through: { attributes: [] },
      },
    ],
  });
  const roomById = new Map(roomsWithResources.map((room) => [room.id, room]));

  return {
    count: result.count,
    rows: result.rows.map((room) => roomById.get(room.id) ?? room),
  };
}

export async function findResources() {
  return Resource.findAll({
    attributes: ["code", "name"],
    order: [
      ["name", "ASC"],
      ["code", "ASC"],
    ],
  });
}
