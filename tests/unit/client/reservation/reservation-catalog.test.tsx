/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoomCatalog } from "@/components/room-catalog";
import { api } from "@/services/api/client";
import { toast } from "react-toastify";
import { makeCatalog, makeRoom } from "../../../helpers/factories/room-factory";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;
const toastError = toast.error as jest.Mock;

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  toastError.mockReset();
  get.mockImplementation(
    (url: string, config?: { params?: { date?: string } }) => {
      if (url === "/rooms") return Promise.resolve({ data: makeCatalog() });
      if (url === "/resources") return Promise.resolve({ data: { items: [] } });
      if (url === "/session")
        return Promise.resolve({
          data: { user: { id: 1, name: "Ana", role: "USER" } },
        });
      if (url.includes("/availability"))
        return Promise.resolve({
          data: {
            roomId: 1,
            date: config?.params?.date,
            timezone: "America/Sao_Paulo",
            unavailable: [],
          },
        });
      throw new Error(`Unexpected GET ${url}`);
    },
  );
  post.mockResolvedValue({ data: { reservation: { id: 7 } } });
});

test("TC_SALA_2_034 - sem sessão orienta Entrar como e não abre formulário", async () => {
  get.mockImplementation((url: string) => {
    if (url === "/rooms") return Promise.resolve({ data: makeCatalog() });
    if (url === "/resources") return Promise.resolve({ data: { items: [] } });
    if (url === "/session")
      return Promise.reject(
        Object.assign(new Error("unauthorized"), {
          isAxiosError: true,
          response: { status: 401 },
        }),
      );
    if (url.includes("/availability"))
      return Promise.resolve({
        data: {
          roomId: 1,
          date: "2030-10-20",
          timezone: "America/Sao_Paulo",
          unavailable: [],
        },
      });
    throw new Error(`Unexpected GET ${url}`);
  });
  render(<RoomCatalog />);
  const reserve = await screen.findByRole("button", { name: "Reservar" });
  expect(reserve).toBeEnabled();
  await userEvent.setup().click(reserve);
  await waitFor(() =>
    expect(toastError).toHaveBeenCalledWith(
      "Entre como um usuário para reservar.",
    ),
  );
  expect(
    screen.queryByRole("dialog", { name: "Reservar sala" }),
  ).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith(
    "/session",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});

test("TC_SALA_2_038 - resposta antiga de sessão não substitui a sala escolhida por último", async () => {
  let resolveA!: (value: unknown) => void;
  let resolveB!: (value: unknown) => void;
  const sessionA = new Promise((resolve) => {
    resolveA = resolve;
  });
  const sessionB = new Promise((resolve) => {
    resolveB = resolve;
  });
  let sessionCount = 0;
  get.mockImplementation(
    (url: string, config?: { params?: { date?: string } }) => {
      if (url === "/rooms")
        return Promise.resolve({
          data: makeCatalog({
            items: [makeRoom(), makeRoom({ id: 2, name: "Sala B" })],
            pagination: { page: 1, pageSize: 12, totalItems: 2, totalPages: 1 },
          }),
        });
      if (url === "/resources") return Promise.resolve({ data: { items: [] } });
      if (url === "/session") return ++sessionCount === 1 ? sessionA : sessionB;
      if (url.includes("/availability"))
        return Promise.resolve({
          data: {
            roomId: 2,
            date: config?.params?.date,
            timezone: "America/Sao_Paulo",
            unavailable: [],
          },
        });
      throw new Error(`Unexpected GET ${url}`);
    },
  );

  render(<RoomCatalog />);
  const reserveButtons = await screen.findAllByRole("button", {
    name: "Reservar",
  });
  fireEvent.click(reserveButtons[0]);
  fireEvent.click(reserveButtons[1]);
  expect(reserveButtons[1]).toBeDisabled();
  expect(reserveButtons[0]).toBeEnabled();

  resolveB({ data: { user: { id: 1, name: "Ana", role: "USER" } } });
  const dialog = await screen.findByRole("dialog", { name: "Reservar sala" });
  expect(dialog).toHaveTextContent("Sala B");
  resolveA({ data: { user: { id: 1, name: "Ana", role: "USER" } } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(
    screen.getByRole("dialog", { name: "Reservar sala" }),
  ).toHaveTextContent("Sala B");
  expect(toastError).not.toHaveBeenCalled();
});

test("TC_SALA_2_035 - sessão válida abre diálogo e Cancelar devolve foco ao card", async () => {
  render(<RoomCatalog />);
  const reserve = await screen.findByRole("button", { name: "Reservar" });
  await userEvent.setup().click(reserve);
  expect(
    await screen.findByRole("dialog", { name: "Reservar sala" }),
  ).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Cancelar" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Reservar sala" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(reserve).toHaveFocus());
});

test("TC_SALA_2_036 - sucesso fecha e reabrir inicia formulário limpo", async () => {
  render(<RoomCatalog />);
  const reserve = await screen.findByRole("button", { name: "Reservar" });
  await userEvent.setup().click(reserve);
  await screen.findByRole("dialog", { name: "Reservar sala" });
  fireEvent.change(screen.getByLabelText(/Data da reserva/), {
    target: { value: "2030-10-20" },
  });
  fireEvent.change(screen.getByLabelText(/Horário de entrada/), {
    target: { value: "10:00" },
  });
  fireEvent.change(screen.getByLabelText(/Horário de saída/), {
    target: { value: "11:00" },
  });
  await screen.findByText("Sem horários ocupados nesta data.");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Confirmar reserva" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Reservar sala" }),
    ).not.toBeInTheDocument(),
  );

  await userEvent.setup().click(reserve);
  await screen.findByRole("dialog", { name: "Reservar sala" });
  expect(screen.getByLabelText(/Horário de entrada/)).toHaveValue("");
  expect(screen.getByLabelText(/Horário de saída/)).toHaveValue("");
  expect(get.mock.calls.filter(([url]) => url === "/session")).toHaveLength(2);
});
