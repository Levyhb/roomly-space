import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roomly Space",
  description: "Reserva de salas de reunião",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
