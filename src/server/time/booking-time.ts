import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export const BOOKING_TIMEZONE = "America/Sao_Paulo";

export function isValidDate(value: string): boolean {
  return dayjs(value, "YYYY-MM-DD", true).isValid();
}

export function isBusinessDay(date: string): boolean {
  const weekday = dayjs(date, "YYYY-MM-DD", true).day();
  return weekday >= 1 && weekday <= 5;
}

export function isWithinBusinessHours(
  startTime: string,
  endTime: string,
): boolean {
  return startTime >= "08:00" && endTime <= "20:00";
}

export function localDateTimeToUtc(date: string, time: string): Date {
  const local = `${date} ${time}`;
  const parsed = dayjs.tz(local, "YYYY-MM-DD HH:mm", BOOKING_TIMEZONE);
  if (parsed.format("YYYY-MM-DD HH:mm") !== local) {
    throw new Error("Data ou horário local inexistente");
  }
  return parsed.utc().toDate();
}

export function utcToLocalTime(value: Date): string {
  return dayjs(value).tz(BOOKING_TIMEZONE).format("HH:mm");
}

export function localDayBounds(date: string): { start: Date; end: Date } {
  const nextDate = dayjs(date, "YYYY-MM-DD", true)
    .add(1, "day")
    .format("YYYY-MM-DD");
  return {
    start: localDateTimeToUtc(date, "00:00"),
    end: localDateTimeToUtc(nextDate, "00:00"),
  };
}
