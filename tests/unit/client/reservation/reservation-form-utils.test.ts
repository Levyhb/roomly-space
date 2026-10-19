import {
  bookingDurationMinutes,
  bookingFormError,
  isBookingBusinessDay,
  saoPauloNow,
} from "@/components/reservation-form-utils";

const now = new Date("2030-10-21T12:00:00.000Z");

test("TC_SALA_2_023 - relógio de negócio usa data e hora de São Paulo", () => {
  expect(saoPauloNow(now)).toEqual({ date: "2030-10-21", time: "09:00" });
});

test("TC_SALA_2_024 - exige HH:mm, ordem e duração mínima", () => {
  expect(bookingDurationMinutes("10:00", "10:15")).toBe(15);
  expect(bookingDurationMinutes("10:00", "14:00")).toBe(240);
  expect(bookingFormError("2030-10-22", "10:00", "10:14", [], 240, now)).toBe(
    "A duração mínima é de 15 minutos.",
  );
  expect(bookingFormError("2030-10-22", "11:00", "10:00", [], 240, now)).toBe(
    "O horário de saída deve ser maior que o horário de entrada.",
  );
  expect(bookingFormError("2030-10-22", "9:00", "10:00", [], 240, now)).toBe(
    "Informe entrada e saída em HH:mm.",
  );
  expect(
    bookingFormError("2030-10-22", "10:00", "10:15", [], 240, now),
  ).toBeNull();
});

test("TC_SALA_6_003 - formulário aplica o limite da sala selecionada", () => {
  expect(bookingFormError("2030-10-22", "10:00", "11:01", [], 60, now)).toBe(
    "A duração máxima desta sala é de 60 minutos.",
  );
  expect(
    bookingFormError("2030-10-22", "10:00", "15:00", [], 360, now),
  ).toBeNull();
});

test("TC_SALA_2_025 - rejeita passado e intervalo ocupado, aceita adjacência", () => {
  expect(bookingFormError("2030-10-21", "09:00", "10:00", [], 240, now)).toBe(
    "O início da reserva deve estar no futuro.",
  );
  expect(bookingFormError("2030-10-18", "10:00", "11:00", [], 240, now)).toBe(
    "O início da reserva deve estar no futuro.",
  );
  const unavailable = [{ startTime: "10:00", endTime: "11:00" }];
  expect(
    bookingFormError("2030-10-22", "10:30", "11:30", unavailable, 240, now),
  ).toBe("O horário escolhido está indisponível.");
  expect(
    bookingFormError("2030-10-22", "11:00", "12:00", unavailable, 240, now),
  ).toBeNull();
});

test("TC_SALA_5_004 - formulário valida dias úteis e horário de funcionamento", () => {
  expect(isBookingBusinessDay("2030-10-21")).toBe(true);
  expect(isBookingBusinessDay("2030-10-25")).toBe(true);
  expect(isBookingBusinessDay("2030-10-20")).toBe(false);
  expect(isBookingBusinessDay("2030-10-26")).toBe(false);
  expect(bookingFormError("2030-10-20", "10:00", "11:00", [], 240, now)).toBe(
    "Reservas são permitidas somente de segunda a sexta-feira.",
  );
  for (const [startTime, endTime] of [
    ["07:59", "08:15"],
    ["19:45", "20:01"],
  ]) {
    expect(
      bookingFormError("2030-10-22", startTime, endTime, [], 240, now),
    ).toBe("Reservas são permitidas somente entre 08:00 e 20:00.");
  }
  expect(
    bookingFormError("2030-10-22", "08:00", "08:15", [], 240, now),
  ).toBeNull();
  expect(
    bookingFormError("2030-10-22", "19:45", "20:00", [], 240, now),
  ).toBeNull();
});
