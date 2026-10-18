import { errorResponse } from "@/server/http/api-error";
import { roomQuerySchema } from "@/server/schemas/rooms";
import { validate } from "@/server/schemas/validate";
import {
  getResourceOptions,
  getRoomCatalog,
} from "@/server/services/room-service";

export async function getRoomsResponse(request: Request): Promise<Response> {
  try {
    const params = new URL(request.url).searchParams;
    const query = validate(roomQuerySchema, {
      q: params.get("q") ?? undefined,
      capacity: params.get("capacity") ?? undefined,
      resource: params.get("resource") ?? undefined,
      page: params.get("page") ?? undefined,
    });
    return Response.json(await getRoomCatalog(query));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function getResourcesResponse(): Promise<Response> {
  try {
    return Response.json(await getResourceOptions());
  } catch (error) {
    return errorResponse(error);
  }
}
