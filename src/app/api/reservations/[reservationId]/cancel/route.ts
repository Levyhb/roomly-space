import { cancelOwnReservationResponse } from "@/server/controllers/reservation-controller";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reservationId: string }> },
) {
  const { reservationId } = await context.params;
  return cancelOwnReservationResponse(request, reservationId);
}
