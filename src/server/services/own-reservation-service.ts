import { ApiError } from "@/server/http/api-error";
import {
  findOwnReservationById,
  findOwnReservations,
  markReservationCanceled,
  withImmediateTransaction,
} from "@/server/repositories/reservation-repository";
import type { ListReservationsInput } from "@/server/schemas/reservations";

export async function listOwnReservations(
  userId: number,
  input: ListReservationsInput,
  clock: () => Date = () => new Date(),
) {
  const now = clock();
  const { count, rows } = await findOwnReservations({ userId, ...input, now });
  return {
    items: rows.map((reservation) => {
      const room = reservation.room;
      if (!room) throw new Error("Reserva sem sala associada");
      return {
        id: reservation.id,
        startsAt: reservation.startsAt.toISOString(),
        endsAt: reservation.endsAt.toISOString(),
        status:
          reservation.startsAt > now
            ? "SCHEDULED"
            : reservation.endsAt > now
              ? "IN_PROGRESS"
              : "COMPLETED",
        room: {
          id: room.id,
          name: room.name,
          address: room.address,
          complement: room.complement,
          capacity: room.capacity,
          imageUrl: room.imageUrl,
        },
      };
    }),
    pagination: {
      page: input.page,
      pageSize: 10,
      totalItems: count,
      totalPages: Math.ceil(count / 10),
    },
  };
}

export async function cancelOwnReservation(
  reservationId: number,
  userId: number,
  clock: () => Date = () => new Date(),
): Promise<void> {
  try {
    await withImmediateTransaction(async (transaction) => {
      const reservation = await findOwnReservationById(
        reservationId,
        userId,
        transaction,
      );
      if (!reservation) {
        throw new ApiError(
          404,
          "RESERVATION_NOT_FOUND",
          "Reserva não encontrada",
        );
      }
      const now = clock();
      if (reservation.canceledAt || reservation.startsAt <= now) {
        throw new ApiError(
          409,
          "CANCELLATION_CONFLICT",
          "Reserva não pode ser cancelada",
        );
      }
      const [updated] = await markReservationCanceled(
        reservationId,
        userId,
        now,
        transaction,
      );
      if (updated !== 1) {
        throw new ApiError(
          409,
          "CANCELLATION_CONFLICT",
          "Reserva não pode ser cancelada",
        );
      }
    });
  } catch (error) {
    if (isSqliteBusy(error)) {
      throw new ApiError(
        409,
        "CANCELLATION_CONFLICT",
        "Reserva ocupada; tente novamente",
      );
    }
    throw error;
  }
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
