import {
  reservationDate,
  reservationTime,
} from "@/components/reservation-display";

test("TC_SALA_3_027 - data e horário UTC aparecem no fuso de São Paulo", () => {
  expect(reservationDate("2030-10-20T02:30:00.000Z")).toBe(
    "19 de outubro de 2030",
  );
  expect(reservationTime("2030-10-20T13:00:00.000Z")).toBe("10:00");
});
