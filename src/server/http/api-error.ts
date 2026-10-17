export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("Erro inesperado na API", error);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" } },
    { status: 500 },
  );
}
