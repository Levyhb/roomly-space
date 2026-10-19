import { requireUser } from "@/server/auth/session";
import { ApiError, errorResponse } from "@/server/http/api-error";
import {
  availabilityQuerySchema,
  createReservationSchema,
  roomIdParamSchema,
  listReservationsQuerySchema,
  reservationIdParamSchema,
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
import {
  cancelOwnReservation,
  listOwnReservations,
} from "@/server/services/own-reservation-service";

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

export async function listOwnReservationsResponse(
  request: Request,
): Promise<Response> {
  try {
    const user = await requireUser();
    const input = validate(
      listReservationsQuerySchema,
      searchParamsInput(new URL(request.url).searchParams),
    );
    return Response.json(await listOwnReservations(user.id, input));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function cancelOwnReservationResponse(
  request: Request,
  rawId: string,
): Promise<Response> {
  try {
    if (
      new URL(request.url).searchParams.size > 0 ||
      (await request.text()).length > 0
    ) {
      throw new ApiError(
        400,
        "INVALID_INPUT",
        "Cancelamento não aceita parâmetros nem corpo",
      );
    }
    const user = await requireUser();
    const reservationId = validate(reservationIdParamSchema, rawId);
    await cancelOwnReservation(reservationId, user.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
