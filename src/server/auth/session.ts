import { cookies } from "next/headers";
import type { User, UserRole } from "@/server/db/models";
import { ApiError } from "@/server/http/api-error";
import { findUserById } from "@/server/repositories/user-repository";

export const SESSION_COOKIE_NAME = "roomly_user_id";

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const rawId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawId || !/^[1-9]\d*$/.test(rawId)) {
    return null;
  }

  const userId = Number(rawId);
  if (!Number.isSafeInteger(userId)) {
    return null;
  }

  return findUserById(userId);
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "Sessão ausente ou inválida");
  }

  return user;
}

export function requireRole(user: User, role: UserRole): void {
  if (user.role !== role) {
    throw new ApiError(403, "FORBIDDEN", "Acesso não permitido");
  }
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  requireRole(user, "ADMIN");
  return user;
}
