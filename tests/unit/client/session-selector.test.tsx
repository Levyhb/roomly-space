/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { AppHeader } from "@/components/app-header";
import { api } from "@/services/api/client";
import { makeSessionUser } from "../../helpers/factories/user-factory";

jest.mock("@/services/api/client", () => ({
  api: { post: jest.fn(), delete: jest.fn() },
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("react-toastify", () => ({ toast: { error: jest.fn() } }));

const mockedPost = jest.mocked(api.post);
const mockedToastError = jest.mocked(toast.error);

beforeEach(() => {
  mockedPost.mockReset();
  mockedToastError.mockReset();
});

test("TC_SETUP_003 - troca usuário e mostra sessão retornada pela API", async () => {
  const ana = makeSessionUser();
  const bia = makeSessionUser({ id: 2, name: "Bia Lima", role: "ADMIN" });
  mockedPost.mockResolvedValue({ data: { user: bia } });

  render(<AppHeader users={[ana, bia]} initialUser={null} />);

  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "Entrar como" }));
  await user.click(screen.getByRole("option", { name: "Bia Lima (Admin)" }));

  await waitFor(() => {
    expect(mockedPost).toHaveBeenCalledWith("/session", { userId: 2 });
    expect(screen.getByText("Sessão de Bia Lima · Admin")).toBeInTheDocument();
  });
});

test("TC_SALA_1_017 - exibe toast quando a troca de usuário falha", async () => {
  const ana = makeSessionUser();
  const bia = makeSessionUser({ id: 2, name: "Bia Lima", role: "ADMIN" });
  mockedPost.mockRejectedValueOnce(new Error("network error"));

  render(<AppHeader users={[ana, bia]} initialUser={null} />);

  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "Entrar como" }));
  await user.click(screen.getByRole("option", { name: "Bia Lima (Admin)" }));

  await waitFor(() =>
    expect(mockedToastError).toHaveBeenCalledWith(
      "Não foi possível trocar de usuário. Tente novamente.",
    ),
  );
});
