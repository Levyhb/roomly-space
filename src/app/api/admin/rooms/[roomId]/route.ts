import { editAdminRoomResponse } from "@/server/controllers/admin-room-controller";

export function PATCH(
  request: Request,
  context: { params: Promise<{ roomId: string }> },
): Promise<Response> {
  return context.params.then(({ roomId }) =>
    editAdminRoomResponse(request, roomId),
  );
}
