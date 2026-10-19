import {
  createAdminRoomResponse,
  listAdminRoomsResponse,
} from "@/server/controllers/admin-room-controller";

export function GET(request: Request): Promise<Response> {
  return listAdminRoomsResponse(request);
}

export function POST(request: Request): Promise<Response> {
  return createAdminRoomResponse(request);
}
