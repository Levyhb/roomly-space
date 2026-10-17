import { HomeShell } from "@/components/home-shell";
import type { SessionUser } from "@/components/home-shell";
import { getSessionUser } from "@/server/auth/session";
import { User } from "@/server/db/models";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [users, currentUser] = await Promise.all([
    User.findAll({
      attributes: ["id", "name", "role"],
      order: [["name", "ASC"]],
    }),
    getSessionUser(),
  ]);

  const choices: SessionUser[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
  }));
  const initialUser = currentUser
    ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    : null;

  return <HomeShell users={choices} initialUser={initialUser} />;
}
