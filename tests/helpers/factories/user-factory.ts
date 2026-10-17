import type { SessionUser } from "@/components/home-shell";

export function makeSessionUser(
  overrides: Partial<SessionUser> = {},
): SessionUser {
  return { id: 1, name: "Ana Souza", role: "USER", ...overrides };
}
