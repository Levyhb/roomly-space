import { createReservationResponse } from "@/server/controllers/reservation-controller";

export function POST(request: Request): Promise<Response> {
  return createReservationResponse(request);
}
