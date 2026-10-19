export function roomAddress(room: {
  address: string;
  complement?: string | null;
}): string {
  return room.complement
    ? `${room.address} · ${room.complement}`
    : room.address;
}
