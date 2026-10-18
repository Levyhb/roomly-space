/** @jest-environment jsdom */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoomCatalog } from "@/components/room-catalog";
import { api } from "@/services/api/client";
import { toast } from "react-toastify";
import { makeCatalog, makeRoom } from "../../helpers/factories/room-factory";

let mockSearch = new URLSearchParams();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRouter = { push: mockPush, replace: mockReplace };

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearch,
}));
jest.mock("@/services/api/client", () => ({ api: { get: jest.fn() } }));
jest.mock("react-toastify", () => ({ toast: { error: jest.fn() } }));

const get = api.get as jest.Mock;
const toastError = toast.error as jest.Mock;

function mockApi(catalog = makeCatalog()) {
  get.mockImplementation((url: string) =>
    Promise.resolve(
      url === "/resources"
        ? { data: { items: [{ code: "projector", name: "Projetor" }] } }
        : { data: catalog },
    ),
  );
}

beforeEach(() => {
  mockSearch = new URLSearchParams();
  mockPush.mockReset();
  mockReplace.mockReset();
  get.mockReset();
  toastError.mockReset();
  mockApi();
});

test("TC_SALA_1_020 - URL compartilhada preenche filtros e carrega página", async () => {
  mockSearch = new URLSearchParams(
    "q=Ip%C3%AA&capacity=5-8&resource=projector&page=2",
  );
  mockApi(
    makeCatalog({
      pagination: { page: 2, pageSize: 12, totalItems: 25, totalPages: 3 },
    }),
  );
  render(<RoomCatalog />);

  expect(
    await screen.findByRole("heading", { name: "Sala Ipê" }),
  ).toBeVisible();
  expect(screen.getByRole("textbox", { name: "Buscar por nome" })).toHaveValue(
    "Ipê",
  );
  expect(
    screen.getByRole("combobox", { name: "Capacidade" }),
  ).toHaveTextContent("5 a 8 pessoas");
  expect(screen.getByRole("combobox", { name: "Recurso" })).toHaveTextContent(
    "Projetor",
  );
  await waitFor(() =>
    expect(get).toHaveBeenCalledWith(
      "/rooms",
      expect.objectContaining({
        params: { q: "Ipê", capacity: "5-8", resource: "projector", page: 2 },
      }),
    ),
  );
});

test("TC_SALA_1_021 - busca e filtros atualizam URL e reiniciam página", async () => {
  mockSearch = new URLSearchParams("page=3&resource=projector");
  render(<RoomCatalog />);
  const user = userEvent.setup();

  await user.type(
    screen.getByRole("textbox", { name: "Buscar por nome" }),
    "Ipê",
  );
  await user.click(screen.getByRole("button", { name: "Buscar salas" }));
  expect(mockPush).toHaveBeenLastCalledWith("/?resource=projector&q=Ip%C3%AA", {
    scroll: false,
  });

  await user.click(screen.getByRole("combobox", { name: "Capacidade" }));
  await user.click(screen.getByRole("option", { name: "5 a 8 pessoas" }));
  expect(mockPush).toHaveBeenLastCalledWith(
    "/?resource=projector&capacity=5-8",
    { scroll: false },
  );
});

test("TC_SALA_1_026 - seleção de recurso atualiza URL sem perder a capacidade", async () => {
  mockSearch = new URLSearchParams("capacity=9-12&page=2");
  mockApi(
    makeCatalog({
      pagination: { page: 2, pageSize: 12, totalItems: 13, totalPages: 2 },
    }),
  );
  render(<RoomCatalog />);
  expect(
    await screen.findByRole("heading", { name: "Sala Ipê" }),
  ).toBeVisible();

  await userEvent
    .setup()
    .click(screen.getByRole("combobox", { name: "Recurso" }));
  await userEvent
    .setup()
    .click(screen.getByRole("option", { name: "Projetor" }));
  expect(mockPush).toHaveBeenLastCalledWith(
    "/?capacity=9-12&resource=projector",
    { scroll: false },
  );
});

test("TC_SALA_1_022 - paginação preserva filtros e limita cards a doze", async () => {
  mockSearch = new URLSearchParams("q=Ip%C3%AA");
  mockApi(
    makeCatalog({
      items: Array.from({ length: 13 }, (_, index) =>
        makeRoom({ id: index + 1, name: `Sala ${index + 1}` }),
      ),
      pagination: { page: 1, pageSize: 12, totalItems: 13, totalPages: 2 },
    }),
  );
  render(<RoomCatalog />);

  expect(await screen.findByText("13 salas encontradas")).toBeVisible();
  expect(screen.getAllByRole("article")).toHaveLength(12);
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Go to page 2" }));
  expect(mockPush).toHaveBeenLastCalledWith("/?q=Ip%C3%AA&page=2", {
    scroll: false,
  });
});

test("TC_SALA_1_023 - skeleton aparece até a resposta e resposta antiga é ignorada", async () => {
  let finishFirst!: (value: { data: ReturnType<typeof makeCatalog> }) => void;
  let finishSecond!: (value: { data: ReturnType<typeof makeCatalog> }) => void;
  const first = new Promise<{ data: ReturnType<typeof makeCatalog> }>(
    (resolve) => {
      finishFirst = resolve;
    },
  );
  const second = new Promise<{ data: ReturnType<typeof makeCatalog> }>(
    (resolve) => {
      finishSecond = resolve;
    },
  );
  get.mockImplementation((url: string) =>
    url === "/resources"
      ? Promise.resolve({ data: { items: [] } })
      : get.mock.calls.filter(([path]) => path === "/rooms").length === 1
        ? first
        : second,
  );

  const { rerender } = render(<RoomCatalog />);
  expect(screen.getAllByLabelText("Carregando sala")).toHaveLength(4);

  mockSearch = new URLSearchParams("q=nova");
  rerender(<RoomCatalog />);
  await act(async () =>
    finishSecond({
      data: makeCatalog({ items: [makeRoom({ name: "Sala Nova" })] }),
    }),
  );
  expect(
    await screen.findByRole("heading", { name: "Sala Nova" }),
  ).toBeVisible();
  await act(async () =>
    finishFirst({
      data: makeCatalog({ items: [makeRoom({ name: "Sala Antiga" })] }),
    }),
  );
  expect(
    screen.queryByRole("heading", { name: "Sala Antiga" }),
  ).not.toBeInTheDocument();
});

test("TC_SALA_1_024 - vazio total e filtros sem resultado têm ações corretas", async () => {
  mockApi(
    makeCatalog({
      items: [],
      pagination: { page: 1, pageSize: 12, totalItems: 0, totalPages: 0 },
    }),
  );
  const { rerender } = render(<RoomCatalog />);
  expect(await screen.findByText("Nenhuma sala cadastrada")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Limpar filtros" }),
  ).not.toBeInTheDocument();

  mockSearch = new URLSearchParams("q=xyz&capacity=2-4");
  rerender(<RoomCatalog />);
  expect(await screen.findByText("Nenhuma sala encontrada")).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Limpar filtros" }));
  expect(mockPush).toHaveBeenLastCalledWith("/", { scroll: false });
});

test("TC_SALA_1_025 - erro mostra toast e nova tentativa refaz a chamada", async () => {
  get.mockImplementation((url: string) =>
    url === "/resources"
      ? Promise.resolve({ data: { items: [] } })
      : get.mock.calls.filter(([path]) => path === "/rooms").length === 1
        ? Promise.reject(new Error("offline"))
        : Promise.resolve({ data: makeCatalog() }),
  );
  render(<RoomCatalog />);
  expect(
    await screen.findByText("Não foi possível carregar as salas."),
  ).toBeVisible();
  expect(toastError).toHaveBeenCalledTimes(1);
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByRole("heading", { name: "Sala Ipê" }),
  ).toBeVisible();
  expect(get.mock.calls.filter(([path]) => path === "/rooms")).toHaveLength(2);
});

test("TC_SALA_1_027 - erro nos recursos permite tentar novamente", async () => {
  let resourceCalls = 0;
  get.mockImplementation((url: string) => {
    if (url === "/resources") {
      resourceCalls += 1;
      return resourceCalls === 1
        ? Promise.reject(new Error("offline"))
        : Promise.resolve({
            data: { items: [{ code: "projector", name: "Projetor" }] },
          });
    }
    return Promise.resolve({ data: makeCatalog() });
  });

  render(<RoomCatalog />);
  await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));

  const toastContent = toastError.mock.calls[0][0] as React.ReactElement;
  render(toastContent);
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Tentar novamente" }));

  await waitFor(() =>
    expect(
      get.mock.calls.filter(([path]) => path === "/resources"),
    ).toHaveLength(2),
  );
});

test("TC_SALA_1_028 - página acima do total é ajustada na URL", async () => {
  mockSearch = new URLSearchParams("page=3");
  mockApi(
    makeCatalog({
      items: [],
      pagination: { page: 3, pageSize: 12, totalItems: 5, totalPages: 1 },
    }),
  );

  render(<RoomCatalog />);

  await waitFor(() =>
    expect(mockReplace).toHaveBeenCalledWith("/", { scroll: false }),
  );
  expect(screen.queryByText("Nenhuma sala cadastrada")).not.toBeInTheDocument();
});
