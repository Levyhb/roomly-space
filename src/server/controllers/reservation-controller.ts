import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/api-error";
import {
  availabilityQuerySchema,
  createReservationSchema,
  roomIdParamSchema,
} from "@/server/schemas/reservations";
import {
  readJson,
  searchParamsInput,
  validate,
} from "@/server/schemas/validate";
import {
  createReservation,
  getRoomAvailability,
} from "@/server/services/reservation-service";

export async function getAvailabilityResponse(
  request: Request,
  rawRoomId: string,
): Promise<Response> {
  try {
    const roomId = validate(roomIdParamSchema, rawRoomId);
    const params = new URL(request.url).searchParams;
    const { date } = validate(
      availabilityQuerySchema,
      searchParamsInput(params),
    );
    return Response.json(await getRoomAvailability(roomId, date));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function createReservationResponse(
  request: Request,
): Promise<Response> {
  try {
    const user = await requireUser();
    const input = validate(createReservationSchema, await readJson(request));
    const reservation = await createReservation(input, user.id);
    return Response.json({ reservation }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
