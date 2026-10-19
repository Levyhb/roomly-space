import AdminPage from "@/app/admin/page";
import { getSessionUser } from "@/server/auth/session";
import { redirect } from "next/navigation";

jest.mock("@/server/auth/session", () => ({ getSessionUser: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/components/admin-rooms", () => ({ AdminRooms: () => null }));

const session = jest.mocked(getSessionUser);
const go = jest.mocked(redirect);

beforeEach(() => {
  jest.clearAllMocks();
  go.mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  });
});

test("TC_SALA_4_017 - /admin redireciona visitante e USER no servidor", async () => {
  session.mockResolvedValueOnce(null);
  await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT");
  session.mockResolvedValueOnce({ id: 1, role: "USER" } as Awaited<
    ReturnType<typeof getSessionUser>
  >);
  await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT");
  expect(go).toHaveBeenCalledTimes(2);
  expect(go).toHaveBeenCalledWith("/");
  session.mockResolvedValueOnce({ id: 3, role: "ADMIN" } as Awaited<
    ReturnType<typeof getSessionUser>
  >);
  await expect(AdminPage()).resolves.toBeTruthy();
});
