import { requireAdmin } from "@/server/auth/session";
import { ApiError, errorResponse } from "@/server/http/api-error";
import {
  adminRoomIdSchema,
  adminRoomInputSchema,
  adminRoomQuerySchema,
} from "@/server/schemas/admin-rooms";
import {
  readJson,
  searchParamsInput,
  validate,
} from "@/server/schemas/validate";
import {
  createAdminRoom,
  editAdminRoom,
  listAdminRooms,
} from "@/server/services/admin-room-service";

function rejectQueryParams(request: Request): void {
  if (new URL(request.url).searchParams.size > 0) {
    throw new ApiError(400, "INVALID_INPUT", "Parâmetros não permitidos");
  }
}

export async function listAdminRoomsResponse(
  request: Request,
): Promise<Response> {
  try {
    await requireAdmin();
    const query = validate(
      adminRoomQuerySchema,
      searchParamsInput(new URL(request.url).searchParams),
    );
    return Response.json(await listAdminRooms(query));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function createAdminRoomResponse(
  request: Request,
): Promise<Response> {
  try {
    await requireAdmin();
    rejectQueryParams(request);
    const input = validate(adminRoomInputSchema, await readJson(request));
    const room = await createAdminRoom(input);
    return Response.json({ room }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function editAdminRoomResponse(
  request: Request,
  rawRoomId: string,
): Promise<Response> {
  try {
    await requireAdmin();
    rejectQueryParams(request);
    const roomId = validate(adminRoomIdSchema, rawRoomId);
    const input = validate(adminRoomInputSchema, await readJson(request));
    const room = await editAdminRoom(roomId, input);
    return Response.json({ room });
  } catch (error) {
    return errorResponse(error);
  }
}
