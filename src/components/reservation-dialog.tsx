"use client";

import CloseIcon from "@mui/icons-material/Close";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import axios from "axios";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  bookingDurationMinutes,
  bookingFormError,
  saoPauloNow,
} from "@/components/reservation-form-utils";
import type { OccupiedInterval } from "@/components/reservation-form-utils";
import { RoomImage } from "@/components/room-image";
import { roomAddress } from "@/components/room-address";
import { api } from "@/services/api/client";
import type { CatalogRoom } from "@/types/room-catalog";

type Availability = {
  roomId: number;
  date: string;
  timezone: string;
  unavailable: OccupiedInterval[];
};

export function ReservationDialog({
  room,
  onClose,
}: {
  room: CatalogRoom;
  onClose: () => void;
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const today = saoPauloNow().date;
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const availabilityKey = `${room.id}|${date}|${availabilityRetry}`;
  const [availabilityResult, setAvailabilityResult] = useState<{
    key: string;
    data: Availability | null;
    error: boolean;
  } | null>(null);
  const availabilityLoading =
    Boolean(date) && availabilityResult?.key !== availabilityKey;
  const availability = availabilityLoading ? null : availabilityResult?.data;
  const availabilityError = !availabilityLoading && availabilityResult?.error;
  const requestId = useRef(0);
  const duration = bookingDurationMinutes(startTime, endTime);

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    api
      .get<Availability>(`/rooms/${room.id}/availability`, {
        params: { date },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (
          currentRequest === requestId.current &&
          !controller.signal.aborted
        ) {
          setAvailabilityResult({ key: availabilityKey, data, error: false });
        }
      })
      .catch(() => {
        if (
          currentRequest === requestId.current &&
          !controller.signal.aborted
        ) {
          setAvailabilityResult({
            key: availabilityKey,
            data: null,
            error: true,
          });
        }
      });
    return () => controller.abort();
  }, [room.id, date, availabilityRetry, availabilityKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const message = bookingFormError(
      date,
      startTime,
      endTime,
      availability?.unavailable ?? [],
    );
    if (message) {
      setFormError(message);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post("/reservations", {
        roomId: room.id,
        date,
        startTime,
        endTime,
      });
      toast.success("Reserva confirmada.");
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error("Horário indisponível. Escolha outro intervalo.");
        setAvailabilityRetry((value) => value + 1);
      } else if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Sessão encerrada. Entre como um usuário para reservar.");
      } else {
        toast.error("Não foi possível confirmar a reserva. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open
      fullScreen={mobile}
      fullWidth
      maxWidth="sm"
      aria-labelledby="reservation-dialog-title"
      onClose={(_, reason) => {
        if (!submitting && (reason !== "backdropClick" || !mobile)) onClose();
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: mobile ? 0 : 2,
            maxHeight: mobile ? "100%" : "calc(100% - 48px)",
          },
        },
      }}
    >
      <DialogTitle
        id="reservation-dialog-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "primary.dark",
          fontWeight: 750,
          fontSize: "1.65rem",
        }}
      >
        Reservar sala
        <IconButton
          aria-label="Fechar reserva"
          onClick={onClose}
          disabled={submitting}
          autoFocus
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={submit} noValidate>
        <DialogContent dividers sx={{ pt: 1.5 }}>
          <Stack spacing={2}>
            <RoomImage
              room={room}
              aspectRatio={{ xs: "16 / 9", sm: "3.2 / 1" }}
            />
            <Box>
              <Typography
                component="h3"
                variant="h5"
                sx={{ fontWeight: 700, color: "primary.dark" }}
              >
                {room.name}
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 0.5, sm: 2 }}
                sx={{ mt: 0.5 }}
              >
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ alignItems: "center" }}
                >
                  <PlaceOutlinedIcon fontSize="small" aria-hidden="true" />
                  <Typography variant="body2">{roomAddress(room)}</Typography>
                </Stack>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ alignItems: "center" }}
                >
                  <GroupsOutlinedIcon fontSize="small" aria-hidden="true" />
                  <Typography variant="body2">
                    {room.capacity} pessoas
                  </Typography>
                </Stack>
              </Stack>
              <Stack
                direction="row"
                useFlexGap
                sx={{ flexWrap: "wrap", gap: 0.75, mt: 1.5 }}
                aria-label="Recursos da sala"
              >
                {room.resources.map((resource) => (
                  <Chip
                    key={resource.code}
                    label={resource.name}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
            <Divider />
            <Typography
              component="h4"
              variant="h6"
              sx={{ fontWeight: 700, color: "primary.dark" }}
            >
              Registrar reserva
            </Typography>
            <TextField
              label="Data da reserva"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setFormError(null);
              }}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: today },
              }}
              fullWidth
              required
            />
            <Box
              aria-label="Horários indisponíveis"
              aria-live="polite"
              sx={{ minHeight: 48 }}
              style={{ color: "#FF3B30" }}
            >
              {availabilityLoading ? (
                <Stack
                  direction="row"
                  spacing={1}
                  aria-label="Carregando horários indisponíveis"
                >
                  <span className="visually-hidden">
                    Carregando horários indisponíveis
                  </span>
                  <Skeleton variant="rounded" width={130} height={32} />
                  <Skeleton variant="rounded" width={100} height={32} />
                </Stack>
              ) : availabilityError ? (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", flexWrap: "wrap" }}
                >
                  <Typography variant="body2">
                    Não foi possível consultar os horários.
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setAvailabilityRetry((value) => value + 1)}
                  >
                    Tentar novamente
                  </Button>
                </Stack>
              ) : !date ? (
                <Typography variant="body2">
                  Selecione uma data para consultar os horários.
                </Typography>
              ) : availability?.unavailable.length ? (
                <Stack
                  direction="row"
                  useFlexGap
                  sx={{ gap: 0.75, flexWrap: "wrap", alignItems: "center" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Horários indisponíveis
                  </Typography>
                  {availability.unavailable.map((interval, index) => (
                    <Chip
                      key={`${interval.startTime}-${interval.endTime}-${index}`}
                      label={`${interval.startTime}–${interval.endTime}`}
                      size="small"
                      sx={{ bgcolor: "#f3e8f8" }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Sem horários ocupados nesta data.
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <TextField
                label="Horário de entrada"
                type="time"
                value={startTime}
                onChange={(event) => {
                  setStartTime(event.target.value);
                  setFormError(null);
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { step: 60 },
                }}
                required
                fullWidth
              />
              <TextField
                label="Horário de saída"
                type="time"
                value={endTime}
                onChange={(event) => {
                  setEndTime(event.target.value);
                  setFormError(null);
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { step: 60 },
                }}
                required
                fullWidth
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Duração permitida: 15 minutos a 4 horas.
              <span style={{ color: "var(--color-accent)" }}>
                {duration !== null && duration > 0
                  ? ` Selecionada: ${duration} minutos.`
                  : ""}
              </span>
            </Typography>
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2.5,
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={submitting}
            sx={{ flex: 1, width: { xs: "100%", sm: "auto" } }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={submitting}
            sx={{ flex: 1, width: { xs: "100%", sm: "auto" } }}
            style={{ color: "white" }}
          >
            {submitting ? "Confirmando..." : "Confirmar reserva"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
