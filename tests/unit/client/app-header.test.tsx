/** @jest-environment jsdom */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "@/components/app-header";
import { makeSessionUser } from "../../helpers/factories/user-factory";

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));
jest.mock("@/services/api/client", () => ({
  api: { post: jest.fn(), delete: jest.fn() },
}));

test("TC_SALA_1_015 - abre e fecha o menu móvel com Escape", async () => {
  render(<AppHeader users={[makeSessionUser()]} initialUser={null} />);
  const user = userEvent.setup();
  const trigger = screen.getByRole("button", { name: "Abrir menu" });

  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(
    screen.getByRole("navigation", { name: "Navegação móvel" }),
  ).toBeVisible();

  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(trigger).toHaveAttribute("aria-expanded", "false"),
  );
});

test("TC_SALA_1_016 - mostra os três links e indica a rota ativa", async () => {
  render(<AppHeader users={[makeSessionUser()]} initialUser={null} />);

  const desktopNavigation = screen.getByRole("navigation", {
    name: "Navegação principal",
  });
  expect(
    within(desktopNavigation).getByRole("link", { name: "Salas" }),
  ).toHaveAttribute("aria-current", "page");

  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Abrir menu" }));
  const mobileNavigation = screen.getByRole("navigation", {
    name: "Navegação móvel",
  });
  expect(
    within(mobileNavigation).getByRole("link", { name: "Salas" }),
  ).toHaveAttribute("href", "/");
  expect(
    within(mobileNavigation).getByRole("link", { name: "Minhas reservas" }),
  ).toHaveAttribute("href", "/my-reservations");
  expect(
    within(mobileNavigation).getByRole("link", { name: "Admin" }),
  ).toHaveAttribute("href", "/admin");
});
