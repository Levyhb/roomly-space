import {
  clearSessionResponse,
  getSessionResponse,
  selectUserResponse,
} from "@/server/controllers/session-controller";

export function GET(): Promise<Response> {
  return getSessionResponse();
}

export function POST(request: Request): Promise<Response> {
  return selectUserResponse(request);
}

export function DELETE(): Response {
  return clearSessionResponse();
}
