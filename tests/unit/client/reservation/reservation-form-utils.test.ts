import {
  bookingDurationMinutes,
  bookingFormError,
  saoPauloNow,
} from "@/components/reservation-form-utils";

const now = new Date("2030-10-19T12:00:00.000Z");

test("TC_SALA_2_023 - relógio de negócio usa data e hora de São Paulo", () => {
  expect(saoPauloNow(now)).toEqual({ date: "2030-10-19", time: "09:00" });
});

test("TC_SALA_2_024 - exige HH:mm, ordem e limites inclusivos", () => {
  expect(bookingDurationMinutes("10:00", "10:15")).toBe(15);
  expect(bookingDurationMinutes("10:00", "14:00")).toBe(240);
  for (const [start, end] of [
    ["10:00", "10:14"],
    ["10:00", "14:01"],
    ["11:00", "10:00"],
  ]) {
    expect(bookingFormError("2030-10-20", start, end, [], now)).toBe(
      "A duração deve ser de 15 minutos a 4 horas.",
    );
  }
  expect(bookingFormError("2030-10-20", "9:00", "10:00", [], now)).toBe(
    "Informe entrada e saída em HH:mm.",
  );
  expect(bookingFormError("2030-10-20", "10:00", "10:15", [], now)).toBeNull();
  expect(bookingFormError("2030-10-20", "10:00", "14:00", [], now)).toBeNull();
});

test("TC_SALA_2_025 - rejeita passado e intervalo ocupado, aceita adjacência", () => {
  expect(bookingFormError("2030-10-19", "09:00", "10:00", [], now)).toBe(
    "O início da reserva deve estar no futuro.",
  );
  expect(bookingFormError("2030-10-18", "10:00", "11:00", [], now)).toBe(
    "O início da reserva deve estar no futuro.",
  );
  const unavailable = [{ startTime: "10:00", endTime: "11:00" }];
  expect(
    bookingFormError("2030-10-20", "10:30", "11:30", unavailable, now),
  ).toBe("O horário escolhido está indisponível.");
  expect(
    bookingFormError("2030-10-20", "11:00", "12:00", unavailable, now),
  ).toBeNull();
});
