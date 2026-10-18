import { getAvailabilityResponse } from "@/server/controllers/reservation-controller";

export function GET(
  request: Request,
  context: { params: Promise<{ roomId: string }> },
): Promise<Response> {
  return context.params.then(({ roomId }) =>
    getAvailabilityResponse(request, roomId),
  );
}
