import { User } from "@/server/db/models";

export function findUserById(id: number): Promise<User | null> {
  return User.findByPk(id, { attributes: ["id", "name", "role"] });
}
