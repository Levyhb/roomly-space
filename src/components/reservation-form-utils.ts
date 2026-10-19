export type OccupiedInterval = { startTime: string; endTime: string };

function saoPauloParts(now: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function saoPauloNow(now = new Date()): { date: string; time: string } {
  const parts = saoPauloParts(now);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function isValidBookingDate(date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
  );
}

export function isBookingBusinessDay(date: string): boolean {
  if (!isValidBookingDate(date)) return false;
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return weekday >= 1 && weekday <= 5;
}

export function bookingDurationMinutes(
  startTime: string,
  endTime: string,
): number | null {
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)
  ) {
    return null;
  }
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return endHour * 60 + endMinute - startHour * 60 - startMinute;
}

export function bookingFormError(
  date: string,
  startTime: string,
  endTime: string,
  unavailable: OccupiedInterval[],
  now = new Date(),
): string | null {
  if (!isValidBookingDate(date)) {
    return "Escolha uma data válida.";
  }
  if (!isBookingBusinessDay(date)) {
    return "Reservas são permitidas somente de segunda a sexta-feira.";
  }
  const duration = bookingDurationMinutes(startTime, endTime);
  if (duration === null) return "Informe entrada e saída em HH:mm.";
  if (duration <= 0)
    return "O horário de saída deve ser maior que o horário de entrada.";
  if (duration < 15 || duration > 240)
    return "A duração deve ser de 15 minutos a 4 horas.";
  if (startTime < "08:00" || endTime > "20:00")
    return "Reservas são permitidas somente entre 08:00 e 20:00.";

  const current = saoPauloNow(now);
  if (
    date < current.date ||
    (date === current.date && startTime <= current.time)
  ) {
    return "O início da reserva deve estar no futuro.";
  }
  if (
    unavailable.some(
      (interval) =>
        startTime < interval.endTime && endTime > interval.startTime,
    )
  ) {
    return "O horário escolhido está indisponível.";
  }
  return null;
}
