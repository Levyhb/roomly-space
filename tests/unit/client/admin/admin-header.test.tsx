/** @jest-environment jsdom */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "@/components/app-header";
import { api } from "@/services/api/client";
import { makeSessionUser } from "../../../helpers/factories/user-factory";

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/services/api/client", () => ({
  api: { post: jest.fn(), delete: jest.fn() },
}));
jest.mock("react-toastify", () => ({ toast: { error: jest.fn() } }));

const admin = makeSessionUser({ id: 3, name: "Carla", role: "ADMIN" });
const common = makeSessionUser({ id: 1, name: "Ana", role: "USER" });

beforeEach(() => {
  mockReplace.mockReset();
  jest.mocked(api.post).mockReset();
  jest.mocked(api.delete).mockReset();
});

test("TC_SALA_4_018 - link Admin aparece apenas para ADMIN e perda da role redireciona", async () => {
  const view = render(
    <AppHeader users={[admin, common]} initialUser={admin} />,
  );
  const desktop = screen.getByRole("navigation", {
    name: "Navegação principal",
  });
  expect(within(desktop).getByRole("link", { name: "Admin" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Abrir menu" }));
  expect(
    within(
      screen.getByRole("navigation", { name: "Navegação móvel" }),
    ).getByRole("link", { name: "Admin" }),
  ).toBeVisible();
  view.unmount();

  render(<AppHeader users={[admin, common]} initialUser={admin} />);
  jest.mocked(api.post).mockResolvedValueOnce({ data: { user: common } });
  await userEvent
    .setup()
    .click(screen.getByRole("combobox", { name: "Entrar como" }));
  await userEvent.setup().click(screen.getByRole("option", { name: "Ana" }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  expect(
    within(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    ).queryByRole("link", { name: "Admin" }),
  ).not.toBeInTheDocument();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Abrir menu" }));
  expect(
    within(
      screen.getByRole("navigation", { name: "Navegação móvel" }),
    ).queryByRole("link", { name: "Admin" }),
  ).not.toBeInTheDocument();
});
