import { getHealthResponse } from "@/server/controllers/health-controller";

export function GET(): Response {
  return getHealthResponse();
}
