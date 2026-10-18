import type { OwnReservationStatus } from "@/types/own-reservation";

const timeZone = "America/Sao_Paulo";

export function reservationDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function reservationTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export const reservationStatusLabel: Record<OwnReservationStatus, string> = {
  SCHEDULED: "Agendada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
};
