import { getResourcesResponse } from "@/server/controllers/room-controller";

export function GET(): Promise<Response> {
  return getResourcesResponse();
}
