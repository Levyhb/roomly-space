import { Box } from "@mui/material";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminRooms } from "@/components/admin-rooms";
import { getSessionUser } from "@/server/auth/session";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") redirect("/");

  return (
    <Box component="main">
      <Suspense fallback={null}>
        <AdminRooms />
      </Suspense>
    </Box>
  );
}
