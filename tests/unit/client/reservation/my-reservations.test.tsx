/** @jest-environment jsdom */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyReservations } from "@/components/my-reservations";
import { api } from "@/services/api/client";
import { SESSION_CHANGED_EVENT } from "@/types/session";
import { toast } from "react-toastify";
import {
  makeOwnReservation,
  makeOwnReservationsResponse,
} from "../../../helpers/factories/reservation-factory";

let mockQuery = "";
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRouter = { push: mockPush, replace: mockReplace };
jest.mock("next/navigation", () => ({
  usePathname: () => "/my-reservations",
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(mockQuery),
}));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), patch: jest.fn() },
}));
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const get = api.get as jest.Mock;
const patch = api.patch as jest.Mock;
const toastError = toast.error as jest.Mock;
const toastSuccess = toast.success as jest.Mock;

beforeEach(() => {
  mockQuery = "";
  mockPush.mockReset();
  mockReplace.mockReset();
  get.mockReset();
  patch.mockReset();
  toastError.mockReset();
  toastSuccess.mockReset();
  get.mockResolvedValue({ data: makeOwnReservationsResponse() });
  patch.mockResolvedValue({ status: 204 });
});

test("TC_SALA_3_014 - URL alimenta busca, situação e página; nova busca reinicia página", async () => {
  mockQuery = "q=Ip%C3%AA&status=completed&page=2";
  get.mockResolvedValue({
    data: makeOwnReservationsResponse(
      [makeOwnReservation({ status: "COMPLETED" })],
      { page: 2, totalPages: 2, totalItems: 11 },
    ),
  });
  render(<MyReservations />);
  await screen.findByText("Ipê");
  expect(get).toHaveBeenCalledWith(
    "/reservations",
    expect.objectContaining({
      params: { q: "Ipê", status: "completed", page: 2 },
      signal: expect.any(AbortSignal),
    }),
  );
  fireEvent.change(screen.getByLabelText("Buscar por nome da sala"), {
    target: { value: "Jatobá" },
  });
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Buscar reservas" }));
  expect(mockPush).toHaveBeenCalledWith(
    "/my-reservations?q=Jatob%C3%A1&status=completed",
    { scroll: false },
  );
  await userEvent
    .setup()
    .click(screen.getByRole("combobox", { name: "Situação" }));
  await userEvent.setup().click(screen.getByRole("option", { name: "Todas" }));
  expect(mockPush).toHaveBeenCalledWith(
    "/my-reservations?q=Ip%C3%AA&status=all",
    { scroll: false },
  );
});

test("TC_SALA_3_015 - loading usa skeleton e resposta antiga não substitui filtro novo", async () => {
  let resolveA!: (value: unknown) => void;
  let resolveB!: (value: unknown) => void;
  get.mockImplementation(
    (_url: string, config: { params: { q?: string } }) =>
      new Promise((resolve) => {
        if (config.params.q === "B") resolveB = resolve;
        else resolveA = resolve;
      }),
  );
  const view = render(<MyReservations />);
  expect(screen.getByLabelText("Carregando minhas reservas")).toBeVisible();
  expect(screen.getAllByLabelText("Carregando reserva")).toHaveLength(3);
  mockQuery = "q=B";
  view.rerender(<MyReservations />);
  expect(get.mock.calls[0][1].signal.aborted).toBe(true);
  resolveB({
    data: makeOwnReservationsResponse([
      makeOwnReservation({
        id: 2,
        room: {
          id: 2,
          name: "Sala B",
          address: "Torre B",
          capacity: 4,
          imageUrl: null,
        },
      }),
    ]),
  });
  expect(await screen.findByText("Sala B")).toBeVisible();
  await act(async () => {
    resolveA({
      data: makeOwnReservationsResponse([
        makeOwnReservation({
          room: {
            id: 1,
            name: "Sala A",
            address: "Torre A",
            capacity: 8,
            imageUrl: null,
          },
        }),
      ]),
    });
  });
  expect(screen.queryByText("Sala A")).not.toBeInTheDocument();
  expect(screen.getByText("Sala B")).toBeVisible();
});

test("TC_SALA_3_016 - sem sessão orienta entrar e troca de sessão recarrega", async () => {
  get
    .mockRejectedValueOnce(
      Object.assign(new Error("unauthorized"), {
        isAxiosError: true,
        response: { status: 401 },
      }),
    )
    .mockResolvedValueOnce({ data: makeOwnReservationsResponse() });
  render(<MyReservations />);
  expect(
    await screen.findByText("Entre como um usuário para ver suas reservas"),
  ).toBeVisible();
  expect(toastError).not.toHaveBeenCalled();
  act(() => window.dispatchEvent(new Event(SESSION_CHANGED_EVENT)));
  expect(await screen.findByText("Ipê")).toBeVisible();
  expect(get).toHaveBeenCalledTimes(2);
});

test("TC_SALA_3_017 - vazio total oferece catálogo; filtro sem resultado permite limpar", async () => {
  get.mockResolvedValue({ data: makeOwnReservationsResponse([]) });
  const view = render(<MyReservations />);
  expect(
    await screen.findByRole("link", { name: "Reservar uma sala" }),
  ).toHaveAttribute("href", "/");
  mockQuery = "q=Ausente";
  view.rerender(<MyReservations />);
  expect(await screen.findByText("Nenhuma reserva encontrada")).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getAllByRole("button", { name: "Limpar filtros" })[1]);
  expect(mockPush).toHaveBeenCalledWith("/my-reservations", { scroll: false });
});

test("TC_SALA_3_018 - erro de lista permite retry", async () => {
  get
    .mockRejectedValueOnce(new Error("network"))
    .mockResolvedValueOnce({ data: makeOwnReservationsResponse() });
  render(<MyReservations />);
  await screen.findByText("Não foi possível carregar suas reservas.");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Ipê")).toBeVisible();
  expect(toastError).toHaveBeenCalledWith(
    "Não foi possível carregar suas reservas.",
  );
});

test("TC_SALA_3_019 - página acima do total é normalizada", async () => {
  mockQuery = "status=all&page=3";
  get.mockResolvedValue({
    data: makeOwnReservationsResponse([], {
      page: 3,
      totalPages: 2,
      totalItems: 15,
    }),
  });
  render(<MyReservations />);
  await waitFor(() =>
    expect(mockReplace).toHaveBeenCalledWith(
      "/my-reservations?status=all&page=2",
      { scroll: false },
    ),
  );
});

test("TC_SALA_3_020 - card mostra dados, detalhes são leitura e não consultam disponibilidade", async () => {
  render(<MyReservations />);
  const article = await screen.findByRole("article");
  expect(within(article).getByText("Ipê")).toBeVisible();
  expect(within(article).getByText("8 pessoas")).toBeVisible();
  expect(within(article).getByText("Agendada")).toBeVisible();
  expect(
    within(article).getByRole("img", { name: "Imagem de Ipê" }),
  ).toHaveAttribute("src", expect.stringContaining("room-placeholder.png"));
  const trigger = within(article).getByRole("button", {
    name: "Visualizar reserva",
  });
  await userEvent.setup().click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Detalhes da reserva" });
  expect(within(dialog).getByLabelText("Data da reserva")).toHaveAttribute(
    "readonly",
  );
  expect(within(dialog).getByLabelText("Horário de entrada")).toHaveAttribute(
    "readonly",
  );
  expect(within(dialog).getByLabelText("Horário de saída")).toHaveAttribute(
    "readonly",
  );
  expect(get).toHaveBeenCalledTimes(1);
  await userEvent
    .setup()
    .click(within(dialog).getByRole("button", { name: "Fechar" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Detalhes da reserva" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
});

test("TC_SALA_3_021 - concluída não oferece cancelamento; agendada pede confirmação", async () => {
  get.mockResolvedValue({
    data: makeOwnReservationsResponse([
      makeOwnReservation({ status: "COMPLETED" }),
    ]),
  });
  const view = render(<MyReservations />);
  await userEvent
    .setup()
    .click(await screen.findByRole("button", { name: "Visualizar reserva" }));
  expect(
    screen.queryByRole("button", { name: "Cancelar reserva" }),
  ).not.toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole("button", { name: "Fechar" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Detalhes da reserva" }),
    ).not.toBeInTheDocument(),
  );
  get.mockResolvedValue({ data: makeOwnReservationsResponse() });
  act(() => window.dispatchEvent(new Event(SESSION_CHANGED_EVENT)));
  await screen.findByText("Agendada");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Visualizar reserva" }));
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Cancelar reserva" }));
  const confirmation = screen.getByRole("dialog", { name: "Cancelar reserva" });
  expect(
    within(confirmation).getByText(
      "Deseja realmente cancelar esta reserva? Ao confirmar, o horário ficará disponível para novas reservas. Esta ação não poderá ser desfeita.",
    ),
  ).toBeVisible();
  await userEvent
    .setup()
    .click(within(confirmation).getByRole("button", { name: "Voltar" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Cancelar reserva" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.getByRole("dialog", { name: "Detalhes da reserva" }),
  ).toBeVisible();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Cancelar reserva" }),
    ).toHaveFocus(),
  );
  view.unmount();
});

test("TC_SALA_3_022 - confirmação bloqueia envio duplo, fecha, mostra toast e recarrega", async () => {
  let finish!: (value: unknown) => void;
  patch.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<MyReservations />);
  await userEvent
    .setup()
    .click(await screen.findByRole("button", { name: "Visualizar reserva" }));
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Cancelar reserva" }));
  const confirm = screen.getByRole("button", {
    name: "Confirmar cancelamento",
  });
  fireEvent.click(confirm);
  expect(screen.getByRole("button", { name: "Cancelando..." })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Cancelando..." }));
  expect(patch).toHaveBeenCalledTimes(1);
  expect(patch).toHaveBeenCalledWith("/reservations/1/cancel");
  await act(async () => finish({ status: 204 }));
  expect(
    screen.getByRole("dialog", { name: "Cancelar reserva", hidden: true }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Buscar por nome da sala")).not.toHaveFocus();
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Cancelar reserva" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Detalhes da reserva" }),
    ).not.toBeInTheDocument(),
  );
  expect(toastSuccess).toHaveBeenCalled();
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(screen.getByLabelText("Buscar por nome da sala")).toHaveFocus(),
  );
});

test("TC_SALA_3_023 - falha de cancelamento mantém contexto e permite tentar novamente", async () => {
  patch
    .mockRejectedValueOnce(
      Object.assign(new Error("conflict"), {
        isAxiosError: true,
        response: { status: 409 },
      }),
    )
    .mockResolvedValueOnce({ status: 204 });
  render(<MyReservations />);
  await userEvent
    .setup()
    .click(await screen.findByRole("button", { name: "Visualizar reserva" }));
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Cancelar reserva" }));
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
  await waitFor(() =>
    expect(toastError).toHaveBeenCalledWith(
      "Esta reserva não pode mais ser cancelada. Atualize a lista.",
    ),
  );
  expect(
    screen.getByRole("dialog", { name: "Cancelar reserva" }),
  ).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
  await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  expect(patch).toHaveBeenCalledTimes(2);
});

test("TC_SALA_3_024 - paginação altera apenas page na URL", async () => {
  get.mockResolvedValue({
    data: makeOwnReservationsResponse([makeOwnReservation()], {
      totalItems: 21,
      totalPages: 3,
    }),
  });
  render(<MyReservations />);
  await screen.findByText("Ipê");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Go to page 2" }));
  expect(mockPush).toHaveBeenCalledWith("/my-reservations?page=2", {
    scroll: false,
  });
});

test("TC_SALA_3_025 - detalhes ocupam a tela em largura móvel", async () => {
  const original = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
  try {
    render(<MyReservations />);
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Visualizar reserva" }));
    expect(
      screen.getByRole("dialog", { name: "Detalhes da reserva" }),
    ).toHaveClass("MuiDialog-paperFullScreen");
  } finally {
    window.matchMedia = original;
  }
});

test("TC_SALA_3_026 - cancelamento do último item normaliza a página", async () => {
  mockQuery = "page=2";
  get
    .mockResolvedValueOnce({
      data: makeOwnReservationsResponse([makeOwnReservation()], {
        page: 2,
        totalItems: 11,
        totalPages: 2,
      }),
    })
    .mockResolvedValueOnce({
      data: makeOwnReservationsResponse([], {
        page: 2,
        totalItems: 10,
        totalPages: 1,
      }),
    });
  render(<MyReservations />);
  await userEvent
    .setup()
    .click(await screen.findByRole("button", { name: "Visualizar reserva" }));
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Cancelar reserva" }));
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
  await waitFor(() =>
    expect(mockReplace).toHaveBeenCalledWith("/my-reservations", {
      scroll: false,
    }),
  );
});

test("TC_SALA_3_028 - troca de sessão descarta GET antigo ainda pendente", async () => {
  let resolveOld!: (value: unknown) => void;
  get
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockResolvedValueOnce({
      data: makeOwnReservationsResponse([
        makeOwnReservation({
          room: {
            id: 2,
            name: "Sala da nova sessão",
            address: "Torre B",
            capacity: 4,
            imageUrl: null,
          },
        }),
      ]),
    });
  render(<MyReservations />);
  const oldSignal = get.mock.calls[0][1].signal as AbortSignal;
  act(() => window.dispatchEvent(new Event(SESSION_CHANGED_EVENT)));
  expect(oldSignal.aborted).toBe(true);
  expect(await screen.findByText("Sala da nova sessão")).toBeVisible();
  await act(async () => {
    resolveOld({ data: makeOwnReservationsResponse() });
  });
  expect(screen.getByText("Sala da nova sessão")).toBeVisible();
  expect(screen.queryByText("Ipê")).not.toBeInTheDocument();
});

test.each([
  [
    "TC_SALA_3_029",
    400,
    "Não foi possível cancelar a reserva. Tente novamente.",
  ],
  ["TC_SALA_3_030", 401, "Sessão encerrada. Entre como um usuário novamente."],
  [
    "TC_SALA_3_031",
    404,
    "Não foi possível cancelar a reserva. Tente novamente.",
  ],
  [
    "TC_SALA_3_032",
    409,
    "Esta reserva não pode mais ser cancelada. Atualize a lista.",
  ],
])(
  "%s - PATCH %i preserva confirmação e mostra mensagem adequada",
  async (_id, status, message) => {
    patch.mockRejectedValueOnce(
      Object.assign(new Error("request failed"), {
        isAxiosError: true,
        response: { status },
      }),
    );
    render(<MyReservations />);
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Visualizar reserva" }));
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Cancelar reserva" }));
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(message));
    expect(
      screen.getByRole("dialog", { name: "Cancelar reserva" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Confirmar cancelamento" }),
    ).toBeEnabled();
    expect(toastSuccess).not.toHaveBeenCalled();
  },
);
