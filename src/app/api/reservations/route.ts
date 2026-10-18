import {
  createReservationResponse,
  listOwnReservationsResponse,
} from "@/server/controllers/reservation-controller";

export async function GET(request: Request) {
  return listOwnReservationsResponse(request);
}

export function POST(request: Request): Promise<Response> {
  return createReservationResponse(request);
}
