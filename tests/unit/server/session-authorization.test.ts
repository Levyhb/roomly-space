import { cookies } from "next/headers";
import { requireAdmin, requireUser } from "@/server/auth/session";
import { findUserById } from "@/server/repositories/user-repository";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("@/server/repositories/user-repository", () => ({
  findUserById: jest.fn(),
}));

const mockedCookies = jest.mocked(cookies);
const mockedFindUserById = jest.mocked(findUserById);

function setSessionCookie(value?: string) {
  mockedCookies.mockResolvedValue({
    get: jest.fn(() => (value ? { value } : undefined)),
  } as unknown as Awaited<ReturnType<typeof cookies>>);
}

describe("autorização da sessão", () => {
  test("TC_SETUP_001 - rejeita acesso sem cookie de sessão", async () => {
    setSessionCookie();

    await expect(requireUser()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
    expect(mockedFindUserById).not.toHaveBeenCalled();
  });

  test("TC_SETUP_002 - verifica a role consultada no banco para acesso admin", async () => {
    setSessionCookie("2");
    mockedFindUserById.mockResolvedValue({
      id: 2,
      role: "USER",
    } as Awaited<ReturnType<typeof findUserById>>);

    await expect(requireAdmin()).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
    expect(mockedFindUserById).toHaveBeenCalledWith(2);
  });
});
