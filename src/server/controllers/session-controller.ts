import { NextResponse } from "next/server";
import type { User } from "@/server/db/models";
import { requireUser, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { ApiError, errorResponse } from "@/server/http/api-error";
import { findUserById } from "@/server/repositories/user-repository";
import { selectUserSchema } from "@/server/schemas/session";
import { readJson, validate } from "@/server/schemas/validate";

function publicUser(user: User) {
  return { id: user.id, name: user.name, role: user.role };
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function getSessionResponse(): Promise<Response> {
  try {
    const user = await requireUser();
    return Response.json({ user: publicUser(user) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function selectUserResponse(request: Request): Promise<Response> {
  try {
    const input = validate(selectUserSchema, await readJson(request));
    const user = await findUserById(input.userId);
    if (!user) {
      throw new ApiError(400, "UNKNOWN_USER", "Usuário não disponível");
    }

    const response = NextResponse.json({ user: publicUser(user) });
    response.cookies.set(SESSION_COOKIE_NAME, String(user.id), {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export function clearSessionResponse(): Response {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
  return response;
}
