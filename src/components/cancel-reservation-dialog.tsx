"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";

export function CancelReservationDialog({
  open,
  submitting,
  onClose,
  onExited,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onExited: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      disableRestoreFocus
      onTransitionExited={onExited}
      fullWidth
      maxWidth="xs"
      aria-labelledby="cancel-reservation-title"
      aria-describedby="cancel-reservation-description"
      onClose={() => {
        if (!submitting) onClose();
      }}
    >
      <DialogTitle
        id="cancel-reservation-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "primary.dark",
          fontWeight: 700,
        }}
      >
        Cancelar reserva
        <IconButton
          aria-label="Fechar confirmação"
          onClick={onClose}
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography id="cancel-reservation-description">
          Deseja realmente cancelar esta reserva? Ao confirmar, o horário ficará
          disponível para novas reservas. Esta ação não poderá ser desfeita.
        </Typography>
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
          disabled={submitting}
          autoFocus
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Voltar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={submitting}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {submitting ? "Cancelando..." : "Confirmar cancelamento"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
