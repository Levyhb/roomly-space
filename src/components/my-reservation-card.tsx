"use client";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import {
  reservationDate,
  reservationStatusLabel,
  reservationTime,
} from "@/components/reservation-display";
import { RoomImage } from "@/components/room-image";
import type { OwnReservation } from "@/types/own-reservation";

const statusColor = {
  SCHEDULED: { background: "#fff0e5", foreground: "#d84c08" },
  IN_PROGRESS: { background: "#f0e5fa", foreground: "#572166" },
  COMPLETED: { background: "#f0eef2", foreground: "#555166" },
} as const;

export function MyReservationCard({
  reservation,
  onDetails,
}: {
  reservation: OwnReservation;
  onDetails: (trigger: HTMLButtonElement) => void;
}) {
  const status = statusColor[reservation.status];
  return (
    <Card
      component="article"
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "minmax(200px, 1.3fr) repeat(3, minmax(0, 1fr)) minmax(190px, auto)",
        },
        alignItems: "center",
        gap: { xs: 1.5, lg: 2.5 },
        p: 1.25,
        borderRadius: 3,
        boxShadow: "0 6px 24px rgba(35,18,45,.07)",
        overflow: "hidden",
      }}
    >
      <RoomImage
        room={reservation.room}
        aspectRatio={{ xs: "16 / 7", sm: "16 / 9" }}
      />
      <Box sx={{ px: { xs: 1, lg: 0 }, minWidth: 0 }}>
        <Typography
          component="h3"
          variant="h6"
          sx={{ color: "primary.dark", fontWeight: 700 }}
        >
          {reservation.room.name}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 0.5, alignItems: "center" }}
        >
          <PlaceOutlinedIcon fontSize="small" aria-hidden="true" />
          <Typography variant="body2" color="text.secondary">
            {reservation.room.address}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 0.5, alignItems: "center" }}
        >
          <GroupsOutlinedIcon fontSize="small" aria-hidden="true" />
          <Typography variant="body2" color="text.secondary">
            {reservation.room.capacity} pessoas
          </Typography>
        </Stack>
      </Box>
      <Divider sx={{ display: { lg: "none" }, mx: 1 }} />
      <Stack
        spacing={0.7}
        sx={{
          px: { xs: 1, lg: 0 },
          pl: { lg: 2.5 },
          minWidth: 0,
          borderLeft: { lg: "1px solid rgba(38, 11, 72, 0.12)" },
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <CalendarMonthOutlinedIcon fontSize="small" aria-hidden="true" />
          <Typography variant="body2" color="text.secondary">
            {reservationDate(reservation.startsAt)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <ScheduleOutlinedIcon fontSize="small" aria-hidden="true" />
          <Typography variant="body2" color="text.secondary">
            {reservationTime(reservation.startsAt)} –{" "}
            {reservationTime(reservation.endsAt)}
          </Typography>
        </Stack>
      </Stack>
      <Box
        sx={{
          px: { xs: 1, lg: 0 },
          width: "100%",
          minWidth: 0,
        }}
      >
        <Chip
          label={reservationStatusLabel[reservation.status]}
          sx={{
            bgcolor: status.background,
            color: status.foreground,
            fontWeight: 700,
          }}
        />
      </Box>
      <Button
        variant="outlined"
        color="secondary"
        onClick={(event) => onDetails(event.currentTarget)}
        sx={{
          mx: { xs: 1, lg: 0 },
          mb: { xs: 1, lg: 0 },
          minWidth: { md: 190 },
          whiteSpace: "nowrap",
        }}
      >
        Visualizar reserva
      </Button>
    </Card>
  );
}
