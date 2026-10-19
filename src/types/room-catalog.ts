export type RoomResource = { code: string; name: string };

export type CatalogRoom = {
  id: number;
  name: string;
  address: string;
  complement?: string | null;
  description: string;
  capacity: number;
  imageUrl: string | null;
  maxReservationDurationMinutes: number;
  resources: RoomResource[];
};

export type RoomCatalogResponse = {
  items: CatalogRoom[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type ResourceOptionsResponse = {
  items: (RoomResource & { id: number })[];
};
