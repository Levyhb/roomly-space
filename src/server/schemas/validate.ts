import { z } from "zod";
import { ApiError } from "@/server/http/api-error";

export function validate<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ApiError(400, "INVALID_INPUT", "Dados inválidos");
  }

  return result.data;
}

export async function readJson(request: Request): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json")
  ) {
    throw new ApiError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Envie JSON no corpo da requisição",
    );
  }

  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "JSON inválido");
  }
}
