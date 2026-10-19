import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { AppThemeProvider } from "@/components/app-theme-provider";
import { ToastViewport } from "@/components/toast-viewport";
import { getSessionUser } from "@/server/auth/session";
import { findUsersForSessionSelector } from "@/server/repositories/user-repository";
import type { SessionUser } from "@/types/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roomly Space",
  description: "Reserva de salas de reunião",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [users, currentUser] = await Promise.all([
    findUsersForSessionSelector(),
    getSessionUser(),
  ]);
  const choices: SessionUser[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
  }));
  const initialUser: SessionUser | null = currentUser
    ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    : null;

  return (
    <html lang="pt-BR">
      <body>
        <AppThemeProvider>
          <AppHeader users={choices} initialUser={initialUser} />
          {children}
          <ToastViewport />
        </AppThemeProvider>
      </body>
    </html>
  );
}
