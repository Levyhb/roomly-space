"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { FormEvent, useState } from "react";
import type { AdminRoom, AdminRoomInput } from "@/types/admin-room";
import type { ResourceOptionsResponse } from "@/types/room-catalog";

type Resource = ResourceOptionsResponse["items"][number];
type Field = "name" | "description" | "capacity" | "address";

export function AdminRoomDialog({
  open,
  room,
  resources,
  saving,
  serverError,
  onClose,
  onExited,
  onSubmit,
}: {
  open: boolean;
  room: AdminRoom | null;
  resources: Resource[];
  saving: boolean;
  serverError: string | null;
  onClose: () => void;
  onExited: () => void;
  onSubmit: (input: AdminRoomInput) => Promise<void>;
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [name, setName] = useState(room?.name ?? "");
  const [description, setDescription] = useState(room?.description ?? "");
  const [capacity, setCapacity] = useState(room ? String(room.capacity) : "");
  const [address, setAddress] = useState(room?.address ?? "");
  const [complement, setComplement] = useState(room?.complement ?? "");
  const [resourceIds, setResourceIds] = useState<number[]>(
    room?.resourceIds ?? [],
  );
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  function changeResources(event: SelectChangeEvent<number[]>) {
    const value = event.target.value;
    setResourceIds(
      typeof value === "string" ? value.split(",").map(Number) : value,
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nextErrors: Partial<Record<Field, string>> = {};
    if (!name.trim()) nextErrors.name = "Informe o nome da sala.";
    if (!description.trim())
      nextErrors.description = "Informe a descrição da sala.";
    if (!address.trim()) nextErrors.address = "Informe o endereço da sala.";
    const capacityNumber = Number(capacity);
    if (!/^[1-9]\d*$/.test(capacity) || !Number.isSafeInteger(capacityNumber)) {
      nextErrors.capacity = "Informe um número inteiro maior que zero.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    void onSubmit({
      name: name.trim(),
      description: description.trim(),
      capacity: capacityNumber,
      maxReservationDurationMinutes: room?.maxReservationDurationMinutes ?? 240,
      address: address.trim(),
      complement: complement.trim() || null,
      resourceIds,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      onTransitionExited={onExited}
      disableRestoreFocus
      fullScreen={mobile}
      fullWidth
      maxWidth="sm"
      aria-labelledby="admin-room-dialog-title"
      slotProps={{ paper: { sx: { borderRadius: mobile ? 0 : 2 } } }}
    >
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle
          id="admin-room-dialog-title"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "primary.dark",
            fontWeight: 700,
          }}
        >
          {room ? "Editar sala" : "Nova sala"}
          <IconButton
            aria-label="Fechar formulário"
            onClick={onClose}
            disabled={saving}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Nome da sala"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
              required
              autoFocus
              fullWidth
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />
            <TextField
              label="Descrição"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              error={Boolean(errors.description)}
              helperText={errors.description}
              required
              multiline
              minRows={3}
              fullWidth
            />
            <TextField
              label="Capacidade"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              error={Boolean(errors.capacity)}
              helperText={
                errors.capacity ??
                "Número exato de pessoas, inteiro maior que zero."
              }
              required
              type="number"
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              fullWidth
            />
            <TextField
              label="Endereço"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              error={Boolean(errors.address)}
              helperText={errors.address}
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 160 } }}
            />
            <TextField
              label="Complemento"
              value={complement}
              onChange={(event) => setComplement(event.target.value)}
              helperText="Opcional, por exemplo: Sala 5."
              fullWidth
              slotProps={{ htmlInput: { maxLength: 160 } }}
            />
            <FormControl fullWidth>
              <InputLabel id="admin-room-resources-label">Recursos</InputLabel>
              <Select<number[]>
                labelId="admin-room-resources-label"
                label="Recursos"
                multiple
                value={resourceIds}
                onChange={changeResources}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((id) => (
                      <Chip
                        key={id}
                        size="small"
                        label={
                          resources.find((resource) => resource.id === id)
                            ?.name ?? `Recurso ${id}`
                        }
                      />
                    ))}
                  </Box>
                )}
              >
                {resources.map((resource) => (
                  <MenuItem key={resource.id} value={resource.id}>
                    {resource.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Selecione os recursos disponíveis na sala.
              </FormHelperText>
            </FormControl>
            {/* Upload futuro: salvar arquivo e caminho em image_url localmente; na AWS, usar S3, persistir chave/URL e servir com acesso controlado ou CloudFront. */}
            <TextField
              label="Imagem"
              value="Upload indisponível nesta versão"
              disabled
              fullWidth
              helperText="Novas salas usam a imagem padrão; a edição preserva a imagem existente."
            />
            {serverError && (
              <Typography role="alert" color="error">
                {serverError}
              </Typography>
            )}
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
            onClick={onClose}
            disabled={saving}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {saving ? "Salvando..." : "Salvar sala"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
