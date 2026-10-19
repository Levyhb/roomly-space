import { Room, RoomResource } from "@/server/db/models";
import {
  insertAdminRoom,
  replaceRoomResources,
  updateAdminRoom,
} from "@/server/repositories/admin-room-repository";

const input = {
  name: "Sala Nova",
  description: "Descrição",
  capacity: 8,
  address: "Torre A",
  complement: null,
  resourceIds: [1, 3],
};

afterEach(() => jest.restoreAllMocks());

test("TC_SALA_4_014 - criação usa imagem nula e edição não altera imagem", async () => {
  const transaction = {} as Parameters<typeof insertAdminRoom>[1];
  const create = jest.spyOn(Room, "create").mockResolvedValue({} as Room);
  const update = jest.fn().mockResolvedValue({});
  const room = { update } as unknown as Room;
  await insertAdminRoom(input, transaction);
  await updateAdminRoom(room, input, transaction);
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({ imageUrl: null, complement: null }),
    { transaction },
  );
  expect(update).toHaveBeenCalledWith(expect.anything(), { transaction });
  expect(update.mock.calls[0][0]).not.toHaveProperty("imageUrl");
});

test("TC_SALA_4_015 - troca de recursos remove antigos e cria apenas os escolhidos na mesma transação", async () => {
  const transaction = {} as Parameters<typeof replaceRoomResources>[2];
  const destroy = jest.spyOn(RoomResource, "destroy").mockResolvedValue(2);
  const bulkCreate = jest
    .spyOn(RoomResource, "bulkCreate")
    .mockResolvedValue([]);
  await replaceRoomResources(9, [1, 3], transaction);
  expect(destroy).toHaveBeenCalledWith({ where: { roomId: 9 }, transaction });
  expect(bulkCreate).toHaveBeenCalledWith(
    [
      { roomId: 9, resourceId: 1 },
      { roomId: 9, resourceId: 3 },
    ],
    { transaction },
  );
  expect(destroy.mock.invocationCallOrder[0]).toBeLessThan(
    bulkCreate.mock.invocationCallOrder[0],
  );
});
