/** @jest-environment jsdom */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReservationDialog } from "@/components/reservation-dialog";
import { api } from "@/services/api/client";
import { toast } from "react-toastify";
import { makeRoom } from "../../../helpers/factories/room-factory";

jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;
const toastError = toast.error as jest.Mock;
const toastSuccess = toast.success as jest.Mock;
const room = makeRoom();

function availability(
  date: string,
  unavailable: { startTime: string; endTime: string }[] = [],
) {
  return {
    data: { roomId: room.id, date, timezone: "America/Sao_Paulo", unavailable },
  };
}

function fillForm() {
  fireEvent.change(screen.getByLabelText(/Data da reserva/), {
    target: { value: "2030-10-20" },
  });
  fireEvent.change(screen.getByLabelText(/Horário de entrada/), {
    target: { value: "10:00" },
  });
  fireEvent.change(screen.getByLabelText(/Horário de saída/), {
    target: { value: "11:00" },
  });
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  toastError.mockReset();
  toastSuccess.mockReset();
  get.mockImplementation((_: string, config: { params: { date: string } }) =>
    Promise.resolve(availability(config.params.date)),
  );
  post.mockResolvedValue({ data: { reservation: { id: 7 } } });
});

test("TC_SALA_2_026 - diálogo mostra sala, recursos, data, horários e foco inicial", async () => {
  render(<ReservationDialog room={room} onClose={jest.fn()} />);
  expect(screen.getByRole("dialog", { name: "Reservar sala" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Fechar reserva" })).toHaveFocus();
  expect(
    screen.getByRole("img", { name: "Imagem de Sala Ipê" }),
  ).toHaveAttribute("src", expect.stringContaining("room-placeholder.png"));
  expect(screen.getByText("Torre A · 3º andar")).toBeVisible();
  expect(screen.getByText("8 pessoas")).toBeVisible();
  expect(screen.getByText("Projetor")).toBeVisible();
  expect(
    screen.getByText("Duração permitida: de 15 a 240 minutos."),
  ).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "Registrar reserva" }),
  ).toBeVisible();
  expect(screen.getByLabelText(/Data da reserva/)).toHaveAttribute(
    "type",
    "date",
  );
  expect(screen.getByLabelText(/Horário de entrada/)).toHaveAttribute(
    "type",
    "time",
  );
  expect(
    await screen.findByText("Sem horários ocupados nesta data."),
  ).toBeVisible();
});

test("TC_SALA_2_027 - loading só na disponibilidade e resposta antiga não substitui data nova", async () => {
  let finishFirst!: (value: ReturnType<typeof availability>) => void;
  let finishSecond!: (value: ReturnType<typeof availability>) => void;
  get.mockImplementation(
    (_: string, config: { params: { date: string } }) =>
      new Promise((resolve) => {
        if (config.params.date === "2030-10-20") finishSecond = resolve;
        else finishFirst = resolve;
      }),
  );
  render(<ReservationDialog room={room} onClose={jest.fn()} />);
  expect(
    screen.getByLabelText("Carregando horários indisponíveis"),
  ).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "Registrar reserva" }),
  ).toBeVisible();

  fireEvent.change(screen.getByLabelText(/Data da reserva/), {
    target: { value: "2030-10-20" },
  });
  await act(async () =>
    finishSecond(
      availability("2030-10-20", [{ startTime: "14:00", endTime: "15:00" }]),
    ),
  );
  expect(await screen.findByText("14:00–15:00")).toBeVisible();
  await act(async () =>
    finishFirst(
      availability("2026-10-18", [{ startTime: "10:00", endTime: "11:00" }]),
    ),
  );
  expect(screen.getByText("14:00–15:00")).toBeVisible();
  expect(screen.queryByText("10:00–11:00")).not.toBeInTheDocument();
});

test("TC_SALA_2_028 - erro de disponibilidade permite nova tentativa", async () => {
  get.mockRejectedValueOnce(new Error("offline"));
  render(<ReservationDialog room={room} onClose={jest.fn()} />);
  expect(
    await screen.findByText("Não foi possível consultar os horários."),
  ).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByText("Sem horários ocupados nesta data."),
  ).toBeVisible();
  expect(get).toHaveBeenCalledTimes(2);
});

test("TC_SALA_2_029 - entrada inválida ou ocupada não envia POST", async () => {
  get.mockImplementation((_: string, config: { params: { date: string } }) =>
    Promise.resolve(
      availability(config.params.date, [
        { startTime: "10:00", endTime: "11:00" },
      ]),
    ),
  );
  render(<ReservationDialog room={room} onClose={jest.fn()} />);
  fillForm();
  expect(await screen.findByText("10:00–11:00")).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Confirmar reserva" }));
  expect(
    screen.getByText("O horário escolhido está indisponível."),
  ).toBeVisible();
  expect(post).not.toHaveBeenCalled();
});

test("TC_SALA_6_005 - modal bloqueia duração acima do limite da sala", async () => {
  render(
    <ReservationDialog
      room={makeRoom({ maxReservationDurationMinutes: 60 })}
      onClose={jest.fn()}
    />,
  );
  fillForm();
  fireEvent.change(screen.getByLabelText(/Horário de saída/), {
    target: { value: "11:01" },
  });
  await screen.findByText("Sem horários ocupados nesta data.");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Confirmar reserva" }));
  expect(
    screen.getByText("A duração máxima desta sala é de 60 minutos."),
  ).toBeVisible();
  expect(post).not.toHaveBeenCalled();
});

test("TC_SALA_6_007 - horário de saída inválido apresenta erro durante a digitação", async () => {
  render(<ReservationDialog room={room} onClose={jest.fn()} />);
  fireEvent.change(screen.getByLabelText(/Horário de entrada/), {
    target: { value: "11:00" },
  });
  fireEvent.change(screen.getByLabelText(/Horário de saída/), {
    target: { value: "10:00" },
  });

  const endTime = screen.getByLabelText(/Horário de saída/);
  expect(endTime).toHaveAttribute("aria-invalid", "true");
  expect(
    screen.getByText(
      "O horário de saída deve ser maior que o horário de entrada.",
    ),
  ).toBeVisible();

  fireEvent.change(endTime, { target: { value: "12:00" } });
  expect(endTime).toHaveAttribute("aria-invalid", "false");
  expect(
    screen.queryByText(
      "O horário de saída deve ser maior que o horário de entrada.",
    ),
  ).not.toBeInTheDocument();
});

test("TC_SALA_6_006 - erro 400 do servidor preserva horários e mostra a regra", async () => {
  post.mockRejectedValueOnce(
    Object.assign(new Error("invalid duration"), {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          error: {
            message: "A duração máxima desta sala é de 60 minutos",
          },
        },
      },
    }),
  );
  render(<ReservationDialog room={room} onClose={jest.fn()} />);
  fillForm();
  await screen.findByText("Sem horários ocupados nesta data.");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Confirmar reserva" }));

  await waitFor(() =>
    expect(toastError).toHaveBeenCalledWith(
      "A duração máxima desta sala é de 60 minutos",
    ),
  );
  expect(screen.getByLabelText(/Horário de entrada/)).toHaveValue("10:00");
  expect(screen.getByLabelText(/Horário de saída/)).toHaveValue("11:00");
});

test("TC_SALA_2_030 - conflito 409 preserva dados e atualiza disponibilidade", async () => {
  post.mockRejectedValueOnce(
    Object.assign(new Error("conflict"), {
      isAxiosError: true,
      response: { status: 409 },
    }),
  );
  render(<ReservationDialog room={room} onClose={jest.fn()} />);
  fillForm();
  await screen.findByText("Sem horários ocupados nesta data.");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Confirmar reserva" }));

  await waitFor(() =>
    expect(toastError).toHaveBeenCalledWith(
      "Horário indisponível. Escolha outro intervalo.",
    ),
  );
  expect(screen.getByLabelText(/Horário de entrada/)).toHaveValue("10:00");
  expect(screen.getByLabelText(/Horário de saída/)).toHaveValue("11:00");
  await waitFor(() =>
    expect(
      get.mock.calls.filter(
        ([url, config]) =>
          url.includes("/availability") && config.params.date === "2030-10-20",
      ).length,
    ).toBeGreaterThanOrEqual(2),
  );
});

test("TC_SALA_2_031 - confirmação usa payload esperado, loading e fecha com toast", async () => {
  let finishPost!: (value: unknown) => void;
  post.mockReturnValueOnce(
    new Promise((resolve) => {
      finishPost = resolve;
    }),
  );
  const close = jest.fn();
  render(<ReservationDialog room={room} onClose={close} />);
  fillForm();
  await screen.findByText("Sem horários ocupados nesta data.");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Confirmar reserva" }));
  expect(post).toHaveBeenCalledWith("/reservations", {
    roomId: 1,
    date: "2030-10-20",
    startTime: "10:00",
    endTime: "11:00",
  });
  expect(screen.getByRole("button", { name: "Confirmando..." })).toBeDisabled();
  await act(async () => finishPost({ data: { reservation: { id: 7 } } }));
  expect(toastSuccess).toHaveBeenCalledWith("Reserva confirmada.");
  expect(close).toHaveBeenCalledTimes(1);
});

test("TC_SALA_2_032 - fecha por Cancelar, X, Escape e backdrop", async () => {
  const close = jest.fn();
  const { rerender } = render(
    <ReservationDialog room={room} onClose={close} />,
  );
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Cancelar" }));
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Fechar reserva" }));
  await userEvent.setup().keyboard("{Escape}");
  expect(close).toHaveBeenCalledTimes(3);
  rerender(<ReservationDialog room={room} onClose={close} />);
  const backdrop = document.querySelector(".MuiBackdrop-root");
  expect(backdrop).not.toBeNull();
  fireEvent.click(backdrop!);
  expect(close).toHaveBeenCalledTimes(4);
});

test("TC_SALA_2_033 - em largura móvel o diálogo ocupa a tela", async () => {
  const original = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
  try {
    render(<ReservationDialog room={room} onClose={jest.fn()} />);
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveClass(
        "MuiDialog-paperFullScreen",
      ),
    );
  } finally {
    window.matchMedia = original;
  }
});
