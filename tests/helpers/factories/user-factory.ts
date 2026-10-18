import type { SessionUser } from "@/types/session";

export function makeSessionUser(
  overrides: Partial<SessionUser> = {},
): SessionUser {
  return { id: 1, name: "Ana Souza", role: "USER", ...overrides };
}
