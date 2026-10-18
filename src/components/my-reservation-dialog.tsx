"use client";

import CloseIcon from "@mui/icons-material/Close";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  reservationDate,
  reservationStatusLabel,
  reservationTime,
} from "@/components/reservation-display";
import { RoomImage } from "@/components/room-image";
import type { OwnReservation } from "@/types/own-reservation";

const readOnlyFieldSx = {
  "& .MuiInputBase-input": { cursor: "default" },
};

export function MyReservationDialog({
  open,
  reservation,
  onClose,
  onExited,
  onCancel,
  cancelButtonRef,
}: {
  open: boolean;
  reservation: OwnReservation;
  onClose: () => void;
  onExited: () => void;
  onCancel: (trigger: HTMLButtonElement) => void;
  cancelButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog
      open={open}
      disableRestoreFocus
      onTransitionExited={onExited}
      fullScreen={mobile}
      fullWidth
      maxWidth="sm"
      aria-labelledby="my-reservation-dialog-title"
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: mobile ? 0 : 2,
            maxHeight: mobile ? "100%" : "calc(100% - 48px)",
            cursor: "default",
          },
        },
      }}
    >
      <DialogTitle
        id="my-reservation-dialog-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "primary.dark",
          fontWeight: 700,
        }}
      >
        Detalhes da reserva
        <IconButton aria-label="Fechar detalhes" onClick={onClose} autoFocus>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <RoomImage
            room={reservation.room}
            aspectRatio={{ xs: "16 / 9", sm: "3.2 / 1" }}
          />
          <Box>
            <Typography
              component="h3"
              variant="h5"
              sx={{ color: "primary.dark", fontWeight: 700 }}
            >
              {reservation.room.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <PlaceOutlinedIcon fontSize="small" aria-hidden="true" />
              <Typography variant="body2">
                {reservation.room.address}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <GroupsOutlinedIcon fontSize="small" aria-hidden="true" />
              <Typography variant="body2">
                {reservation.room.capacity} pessoas
              </Typography>
            </Stack>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Situação: {reservationStatusLabel[reservation.status]}
          </Typography>
          <TextField
            label="Data da reserva"
            value={reservationDate(reservation.startsAt)}
            slotProps={{ input: { readOnly: true } }}
            sx={readOnlyFieldSx}
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Horário de entrada"
              value={reservationTime(reservation.startsAt)}
              slotProps={{ input: { readOnly: true } }}
              sx={readOnlyFieldSx}
              fullWidth
            />
            <TextField
              label="Horário de saída"
              value={reservationTime(reservation.endsAt)}
              slotProps={{ input: { readOnly: true } }}
              sx={readOnlyFieldSx}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2.5,
          flexDirection: { xs: "column-reverse", sm: "row" },
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Fechar
        </Button>
        {reservation.status === "SCHEDULED" && (
          <Button
            ref={cancelButtonRef}
            variant="contained"
            color="error"
            onClick={(event) => onCancel(event.currentTarget)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Cancelar reserva
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
