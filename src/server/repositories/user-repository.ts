import { User } from "@/server/db/models";

export function findUserById(id: number): Promise<User | null> {
  return User.findByPk(id, { attributes: ["id", "name", "role"] });
}

export function findUsersForSessionSelector(): Promise<User[]> {
  return User.findAll({
    attributes: ["id", "name", "role"],
    order: [["name", "ASC"]],
  });
}
