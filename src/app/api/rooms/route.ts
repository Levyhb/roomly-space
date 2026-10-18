import { getRoomsResponse } from "@/server/controllers/room-controller";

export function GET(request: Request): Promise<Response> {
  return getRoomsResponse(request);
}
