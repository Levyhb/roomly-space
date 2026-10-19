export type OwnReservationStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export type OwnReservation = {
  id: number;
  startsAt: string;
  endsAt: string;
  status: OwnReservationStatus;
  room: {
    id: number;
    name: string;
    address: string;
    complement?: string | null;
    capacity: number;
    imageUrl: string | null;
  };
};

export type OwnReservationsResponse = {
  items: OwnReservation[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};
