import { ApiError } from "@/server/http/api-error";
import {
  findOverlappingReservation,
  findReservationsInRange,
  findRoomById,
  insertReservation,
  withImmediateTransaction,
} from "@/server/repositories/reservation-repository";
import type { CreateReservationInput } from "@/server/schemas/reservations";
import {
  BOOKING_TIMEZONE,
  localDateTimeToUtc,
  localDayBounds,
  utcToLocalTime,
} from "@/server/time/booking-time";

function assertRoomExists<T>(room: T | null): asserts room is T {
  if (!room) throw new ApiError(404, "ROOM_NOT_FOUND", "Sala não encontrada");
}

function isSqliteBusy(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    code?: string;
    parent?: { code?: string };
    original?: { code?: string };
  };
  return [
    candidate.code,
    candidate.parent?.code,
    candidate.original?.code,
  ].some(
    (code) =>
      code?.startsWith("SQLITE_BUSY") || code?.startsWith("SQLITE_LOCKED"),
  );
}

export async function getRoomAvailability(roomId: number, date: string) {
  assertRoomExists(await findRoomById(roomId));
  const { start, end } = localDayBounds(date);
  const reservations = await findReservationsInRange(roomId, start, end);
  return {
    roomId,
    date,
    timezone: BOOKING_TIMEZONE,
    unavailable: reservations.map((reservation) => ({
      startTime: utcToLocalTime(reservation.startsAt),
      endTime: utcToLocalTime(reservation.endsAt),
    })),
  };
}

export async function createReservation(
  input: CreateReservationInput,
  userId: number,
  now: () => Date = () => new Date(),
) {
  let startsAt: Date;
  let endsAt: Date;
  try {
    startsAt = localDateTimeToUtc(input.date, input.startTime);
    endsAt = localDateTimeToUtc(input.date, input.endTime);
  } catch {
    throw new ApiError(400, "INVALID_INPUT", "Data ou horário inválido");
  }

  const minutes = (endsAt.getTime() - startsAt.getTime()) / 60_000;
  if (minutes < 15) {
    throw new ApiError(
      400,
      "INVALID_DURATION",
      "A duração mínima é de 15 minutos",
    );
  }
  if (startsAt.getTime() <= now().getTime()) {
    throw new ApiError(
      400,
      "PAST_RESERVATION",
      "O início deve estar no futuro",
    );
  }

  const room = await findRoomById(input.roomId);
  assertRoomExists(room);
  if (minutes > room.maxReservationDurationMinutes) {
    throw new ApiError(
      400,
      "INVALID_DURATION",
      `A duração máxima desta sala é de ${room.maxReservationDurationMinutes} minutos`,
    );
  }

  try {
    const reservation = await withImmediateTransaction(async (transaction) => {
      const overlap = await findOverlappingReservation(
        input.roomId,
        startsAt,
        endsAt,
        transaction,
      );
      if (overlap) {
        throw new ApiError(409, "RESERVATION_CONFLICT", "Horário indisponível");
      }
      return insertReservation(
        {
          userId,
          roomId: input.roomId,
          startsAt,
          endsAt,
        },
        transaction,
      );
    });

    return {
      id: reservation.id,
      roomId: reservation.roomId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    };
  } catch (error) {
    if (isSqliteBusy(error)) {
      throw new ApiError(
        409,
        "RESERVATION_CONFLICT",
        "Horário indisponível; tente novamente",
      );
    }
    throw error;
  }
}
