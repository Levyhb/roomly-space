export type AdminRoom = {
  id: number;
  name: string;
  description: string;
  capacity: number;
  address: string;
  complement: string | null;
  imageUrl: string | null;
  resourceIds: number[];
};

export type AdminRoomsResponse = {
  items: AdminRoom[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type AdminRoomInput = Omit<AdminRoom, "id" | "imageUrl">;
