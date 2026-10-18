export type SessionUser = {
  id: number;
  name: string;
  role: "USER" | "ADMIN";
};

export const SESSION_CHANGED_EVENT = "roomly:session-changed";
