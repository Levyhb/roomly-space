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
import { AdminRooms } from "@/components/admin-rooms";
import { api } from "@/services/api/client";
import { SESSION_CHANGED_EVENT } from "@/types/session";
import { toast } from "react-toastify";
import {
  makeAdminRoom,
  makeAdminRoomsResponse,
  makeResourceOptions,
} from "../../../helpers/factories/admin-room-factory";

let mockQuery = "";
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRouter = { push: mockPush, replace: mockReplace };
jest.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(mockQuery),
}));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;
const patch = api.patch as jest.Mock;

beforeEach(() => {
  mockQuery = "";
  mockPush.mockReset();
  mockReplace.mockReset();
  get.mockReset();
  post.mockReset();
  patch.mockReset();
  jest.mocked(toast.success).mockReset();
  jest.mocked(toast.error).mockReset();
  get.mockImplementation((path: string) =>
    Promise.resolve({
      data:
        path === "/resources"
          ? makeResourceOptions()
          : makeAdminRoomsResponse(),
    }),
  );
  post.mockResolvedValue({ status: 201 });
  patch.mockResolvedValue({ status: 200 });
});

test("TC_SALA_4_019 - filtros vêm da URL, tabela mostra complemento e ações à direita", async () => {
  mockQuery = "q=Ip%C3%AA&capacity=5-8&resource=projector&page=2";
  get.mockImplementation((path: string) =>
    Promise.resolve({
      data:
        path === "/resources"
          ? makeResourceOptions()
          : makeAdminRoomsResponse([makeAdminRoom()], {
              page: 2,
              totalPages: 2,
              totalItems: 11,
            }),
    }),
  );
  render(<AdminRooms />);
  expect(
    await screen.findByRole("table", { name: "Salas cadastradas" }),
  ).toBeVisible();
  expect(get).toHaveBeenCalledWith(
    "/admin/rooms",
    expect.objectContaining({
      params: { q: "Ipê", capacity: "5-8", resource: "projector", page: 2 },
      signal: expect.any(AbortSignal),
    }),
  );
  const row = screen.getByRole("row", { name: /Ipê/ });
  expect(within(row).getByText("Torre A · Sala 5")).toBeVisible();
  expect(within(row).getByText("8 pessoas")).toBeVisible();
  expect(
    within(row).getByRole("button", { name: "Ações para Ipê" }),
  ).toBeVisible();
  fireEvent.change(screen.getByLabelText("Buscar por nome da sala"), {
    target: { value: "Jatobá" },
  });
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Buscar salas" }));
  expect(mockPush).toHaveBeenCalledWith(
    "/admin?q=Jatob%C3%A1&capacity=5-8&resource=projector",
    { scroll: false },
  );
});

test("TC_SALA_4_020 - skeleton e resposta antiga não substitui consulta nova", async () => {
  let resolveOld!: (value: unknown) => void;
  get.mockImplementation(
    (path: string, config: { params?: { q?: string } }) => {
      if (path === "/resources")
        return Promise.resolve({ data: makeResourceOptions() });
      if (config.params?.q === "B")
        return Promise.resolve({
          data: makeAdminRoomsResponse([
            makeAdminRoom({ id: 2, name: "Sala B" }),
          ]),
        });
      return new Promise((resolve) => {
        resolveOld = resolve;
      });
    },
  );
  const view = render(<AdminRooms />);
  expect(screen.getAllByRole("row", { name: "Carregando sala" })).toHaveLength(
    4,
  );
  mockQuery = "q=B";
  view.rerender(<AdminRooms />);
  expect(
    get.mock.calls.find((call) => call[0] === "/admin/rooms")[1].signal.aborted,
  ).toBe(true);
  expect(await screen.findByText("Sala B")).toBeVisible();
  await act(async () =>
    resolveOld({
      data: makeAdminRoomsResponse([makeAdminRoom({ name: "Sala A" })]),
    }),
  );
  expect(screen.getByText("Sala B")).toBeVisible();
  expect(screen.queryByText("Sala A")).not.toBeInTheDocument();
});

test("TC_SALA_4_021 - erro permite retry; vazio e filtro sem resultado têm ações distintas", async () => {
  get
    .mockImplementationOnce((path: string) =>
      Promise.resolve({
        data:
          path === "/resources"
            ? makeResourceOptions()
            : makeAdminRoomsResponse(),
      }),
    )
    .mockRejectedValueOnce(new Error("network"));
  const first = render(<AdminRooms />);
  expect(
    await screen.findByText("Não foi possível carregar as salas."),
  ).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Ipê")).toBeVisible();
  first.unmount();

  get.mockImplementation((path: string) =>
    Promise.resolve({
      data:
        path === "/resources"
          ? makeResourceOptions()
          : makeAdminRoomsResponse([]),
    }),
  );
  const view = render(<AdminRooms />);
  expect(await screen.findByText("Nenhuma sala cadastrada")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Cadastrar primeira sala" }),
  ).toBeVisible();
  view.unmount();

  mockQuery = "q=Ausente";
  render(<AdminRooms />);
  expect(await screen.findByText("Nenhuma sala encontrada")).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getAllByRole("button", { name: "Limpar filtros" })[1]);
  expect(mockPush).toHaveBeenCalledWith("/admin", { scroll: false });
});

test("TC_SALA_4_022 - menu permite editar e mantém remover desabilitado", async () => {
  render(<AdminRooms />);
  await screen.findByText("Ipê");
  const trigger = screen.getByRole("button", { name: "Ações para Ipê" });
  await userEvent.setup().click(trigger);
  expect(screen.getByRole("menuitem", { name: "Remover" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await userEvent
    .setup()
    .click(screen.getByRole("menuitem", { name: "Editar" }));
  const dialog = screen.getByRole("dialog", { name: "Editar sala" });
  expect(within(dialog).getByLabelText(/Nome da sala/)).toHaveValue("Ipê");
  expect(within(dialog).getByLabelText(/Endereço/)).toHaveValue("Torre A");
  expect(within(dialog).getByLabelText(/Complemento/)).toHaveValue("Sala 5");
  await userEvent
    .setup()
    .click(within(dialog).getByRole("button", { name: "Cancelar" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Editar sala" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
});

test("TC_SALA_4_023 - formulário valida campos e imagem permanece desabilitada", async () => {
  render(<AdminRooms />);
  await screen.findByText("Ipê");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Nova sala" }));
  const dialog = screen.getByRole("dialog", { name: "Nova sala" });
  expect(within(dialog).getByLabelText("Imagem")).toBeDisabled();
  expect(within(dialog).getByLabelText("Imagem")).toHaveValue(
    "Upload indisponível nesta versão",
  );
  await userEvent
    .setup()
    .click(within(dialog).getByRole("button", { name: "Salvar sala" }));
  expect(within(dialog).getByText("Informe o nome da sala.")).toBeVisible();
  expect(
    within(dialog).getByText("Informe um número inteiro maior que zero."),
  ).toBeVisible();
  expect(post).not.toHaveBeenCalled();
});

test("TC_SALA_4_024 - cadastro envia apenas campos permitidos, bloqueia envio duplo e refaz lista", async () => {
  let finish!: (value: unknown) => void;
  post.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<AdminRooms />);
  await screen.findByText("Ipê");
  const trigger = screen.getByRole("button", { name: "Nova sala" });
  await userEvent.setup().click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Nova sala" });
  fireEvent.change(within(dialog).getByLabelText(/Nome da sala/), {
    target: { value: "Sala Nova" },
  });
  fireEvent.change(within(dialog).getByLabelText(/Descrição/), {
    target: { value: "Descrição da sala" },
  });
  fireEvent.change(within(dialog).getByLabelText(/Capacidade/), {
    target: { value: "8" },
  });
  fireEvent.change(within(dialog).getByLabelText(/Endereço/), {
    target: { value: "Torre B" },
  });
  fireEvent.change(within(dialog).getByLabelText(/Complemento/), {
    target: { value: "Sala 7" },
  });
  await userEvent
    .setup()
    .click(within(dialog).getByRole("button", { name: "Salvar sala" }));
  expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith("/admin/rooms", {
    name: "Sala Nova",
    description: "Descrição da sala",
    capacity: 8,
    maxReservationDurationMinutes: 240,
    address: "Torre B",
    complement: "Sala 7",
    resourceIds: [],
  });
  await act(async () => finish({ status: 201 }));
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Nova sala" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(jest.mocked(toast.success)).toHaveBeenCalledWith("Sala cadastrada.");
  await waitFor(() =>
    expect(
      get.mock.calls.filter((call) => call[0] === "/admin/rooms"),
    ).toHaveLength(2),
  );
});

test("TC_SALA_4_025 - edição preserva dados em 409 e PATCH não envia imagem", async () => {
  patch
    .mockRejectedValueOnce(
      Object.assign(new Error("conflict"), {
        isAxiosError: true,
        response: { status: 409 },
      }),
    )
    .mockResolvedValueOnce({ status: 200 });
  render(<AdminRooms />);
  await screen.findByText("Ipê");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Ações para Ipê" }));
  await userEvent
    .setup()
    .click(screen.getByRole("menuitem", { name: "Editar" }));
  const dialog = screen.getByRole("dialog", { name: "Editar sala" });
  fireEvent.change(within(dialog).getByLabelText(/Nome da sala/), {
    target: { value: "Sala editada" },
  });
  await userEvent
    .setup()
    .click(within(dialog).getByRole("button", { name: "Salvar sala" }));
  await waitFor(() =>
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Já existe uma sala com esse nome.",
    ),
  );
  expect(within(dialog).getByLabelText(/Nome da sala/)).toHaveValue(
    "Sala editada",
  );
  expect(patch).toHaveBeenCalledWith(
    "/admin/rooms/1",
    expect.not.objectContaining({ imageUrl: expect.anything() }),
  );
  await userEvent
    .setup()
    .click(within(dialog).getByRole("button", { name: "Salvar sala" }));
  await waitFor(() =>
    expect(jest.mocked(toast.success)).toHaveBeenCalledWith("Sala atualizada."),
  );
});

test("TC_SALA_4_026 - página inválida ou acima do total é normalizada", async () => {
  mockQuery = "page=99";
  get.mockImplementation((path: string) =>
    Promise.resolve({
      data:
        path === "/resources"
          ? makeResourceOptions()
          : makeAdminRoomsResponse([makeAdminRoom()], {
              page: 99,
              totalPages: 2,
              totalItems: 11,
            }),
    }),
  );
  render(<AdminRooms />);
  await waitFor(() =>
    expect(mockReplace).toHaveBeenCalledWith("/admin?page=2", {
      scroll: false,
    }),
  );
  mockQuery = "page=abc";
  mockReplace.mockClear();
  render(<AdminRooms />);
  await waitFor(() =>
    expect(mockReplace).toHaveBeenCalledWith("/admin", { scroll: false }),
  );
});

test("TC_SALA_4_027 - troca de sessão impede resposta antiga e redireciona USER", async () => {
  let resolveOld!: (value: unknown) => void;
  get.mockImplementation((path: string) => {
    if (path === "/resources")
      return Promise.resolve({ data: makeResourceOptions() });
    if (path === "/session")
      return Promise.resolve({ data: { user: { id: 1, role: "USER" } } });
    return new Promise((resolve) => {
      resolveOld = resolve;
    });
  });
  render(<AdminRooms />);
  const oldSignal = get.mock.calls.find((call) => call[0] === "/admin/rooms")[1]
    .signal as AbortSignal;
  act(() => window.dispatchEvent(new Event(SESSION_CHANGED_EVENT)));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  expect(oldSignal.aborted).toBe(true);
  await act(async () => resolveOld({ data: makeAdminRoomsResponse() }));
  expect(screen.queryByText("Ipê")).not.toBeInTheDocument();
});

test("TC_SALA_4_028 - recursos aparecem como chips e são enviados por ID", async () => {
  render(<AdminRooms />);
  await screen.findByText("Ipê");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Nova sala" }));
  const dialog = screen.getByRole("dialog", { name: "Nova sala" });
  await userEvent
    .setup()
    .type(within(dialog).getByLabelText(/Nome da sala/), "Sala Vídeo");
  await userEvent
    .setup()
    .type(within(dialog).getByLabelText(/Descrição/), "Reunião híbrida");
  await userEvent
    .setup()
    .type(within(dialog).getByLabelText(/Capacidade/), "4");
  await userEvent
    .setup()
    .type(within(dialog).getByLabelText(/Endereço/), "Torre A");
  await userEvent
    .setup()
    .click(within(dialog).getByRole("combobox", { name: "Recursos" }));
  await userEvent
    .setup()
    .click(screen.getByRole("option", { name: "Videoconferência" }));
  expect(within(dialog).getByText("Videoconferência")).toBeVisible();
  await userEvent.setup().keyboard("{Escape}");
  await userEvent
    .setup()
    .click(within(dialog).getByRole("button", { name: "Salvar sala" }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      "/admin/rooms",
      expect.objectContaining({ resourceIds: [2] }),
    ),
  );
});

test("TC_SALA_4_029 - modal ocupa a tela no mobile", async () => {
  const original = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
  try {
    render(<AdminRooms />);
    await screen.findByText("Ipê");
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Nova sala" }));
    expect(screen.getByRole("dialog", { name: "Nova sala" })).toHaveClass(
      "MuiDialog-paperFullScreen",
    );
  } finally {
    window.matchMedia = original;
  }
});

test("TC_SALA_4_030 - recursos falham com retry independente da lista", async () => {
  get
    .mockImplementationOnce(() =>
      Promise.reject(new Error("resources unavailable")),
    )
    .mockResolvedValueOnce({ data: makeAdminRoomsResponse() })
    .mockImplementation((path: string) =>
      Promise.resolve({
        data:
          path === "/resources"
            ? makeResourceOptions()
            : makeAdminRoomsResponse(),
      }),
    );
  render(<AdminRooms />);
  expect(
    await screen.findByText("Não foi possível carregar os recursos."),
  ).toBeVisible();
  expect(screen.getByText("Ipê")).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Tentar novamente" }));
  await waitFor(() =>
    expect(
      screen.queryByText("Não foi possível carregar os recursos."),
    ).not.toBeInTheDocument(),
  );
});

test("TC_SALA_4_031 - Escape fecha formulário e devolve foco ao gatilho", async () => {
  render(<AdminRooms />);
  await screen.findByText("Ipê");
  const trigger = screen.getByRole("button", { name: "Nova sala" });
  await userEvent.setup().click(trigger);
  expect(screen.getByRole("dialog", { name: "Nova sala" })).toBeVisible();
  await userEvent.setup().keyboard("{Escape}");
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Nova sala" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
});

test("TC_SALA_4_032 - escrita sem autorização redireciona sem toast de sucesso", async () => {
  post.mockRejectedValueOnce(
    Object.assign(new Error("forbidden"), {
      isAxiosError: true,
      response: { status: 403 },
    }),
  );
  render(<AdminRooms />);
  await screen.findByText("Ipê");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Nova sala" }));
  const dialog = screen.getByRole("dialog", { name: "Nova sala" });
  fireEvent.change(within(dialog).getByLabelText(/Nome da sala/), {
    target: { value: "Sala Nova" },
  });
  fireEvent.change(within(dialog).getByLabelText(/Descrição/), {
    target: { value: "Descrição" },
  });
  fireEvent.change(within(dialog).getByLabelText(/Capacidade/), {
    target: { value: "4" },
  });
  fireEvent.change(within(dialog).getByLabelText(/Endereço/), {
    target: { value: "Torre B" },
  });
  await userEvent
    .setup()
    .click(within(dialog).getByRole("button", { name: "Salvar sala" }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  expect(jest.mocked(toast.success)).not.toHaveBeenCalled();
});

test("TC_SALA_4_033 - selects e paginação atualizam a URL", async () => {
  get.mockImplementation((path: string) =>
    Promise.resolve({
      data:
        path === "/resources"
          ? makeResourceOptions()
          : makeAdminRoomsResponse([makeAdminRoom()], {
              totalItems: 21,
              totalPages: 3,
            }),
    }),
  );
  render(<AdminRooms />);
  await screen.findByText("Ipê");
  await userEvent
    .setup()
    .click(screen.getByRole("combobox", { name: "Capacidade" }));
  await userEvent
    .setup()
    .click(screen.getByRole("option", { name: "5 a 8 pessoas" }));
  expect(mockPush).toHaveBeenCalledWith("/admin?capacity=5-8", {
    scroll: false,
  });
  await userEvent
    .setup()
    .click(screen.getByRole("combobox", { name: "Recurso" }));
  await userEvent
    .setup()
    .click(screen.getByRole("option", { name: "Projetor" }));
  expect(mockPush).toHaveBeenCalledWith("/admin?resource=projector", {
    scroll: false,
  });
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Go to page 2" }));
  expect(mockPush).toHaveBeenCalledWith("/admin?page=2", { scroll: false });
});
