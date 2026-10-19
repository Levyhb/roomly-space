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
  maxDurationMinutes: number,
  now = new Date(),
): string | null {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  ) {
    return "Escolha uma data válida.";
  }
  const duration = bookingDurationMinutes(startTime, endTime);
  if (duration === null) return "Informe entrada e saída em HH:mm.";
  if (duration <= 0)
    return "O horário de saída deve ser maior que o horário de entrada.";
  if (duration < 15) return "A duração mínima é de 15 minutos.";
  if (duration > maxDurationMinutes)
    return `A duração máxima desta sala é de ${maxDurationMinutes} minutos.`;

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
