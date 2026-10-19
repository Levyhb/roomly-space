"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Box,
  Button,
  Container,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { CancelReservationDialog } from "@/components/cancel-reservation-dialog";
import { MyReservationCard } from "@/components/my-reservation-card";
import { MyReservationCardSkeleton } from "@/components/my-reservation-card-skeleton";
import { MyReservationDialog } from "@/components/my-reservation-dialog";
import { api } from "@/services/api/client";
import type {
  OwnReservation,
  OwnReservationsResponse,
} from "@/types/own-reservation";
import { SESSION_CHANGED_EVENT } from "@/types/session";

function SearchField({
  q,
  onSearch,
  inputRef,
}: {
  q: string;
  onSearch: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [value, setValue] = useState(q);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(value.trim());
  }
  return (
    <Box component="form" role="search" onSubmit={submit}>
      <TextField
        label="Buscar por nome da sala"
        inputRef={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <Button
                type="submit"
                aria-label="Buscar reservas"
                sx={{ minWidth: 40 }}
              >
                <SearchOutlinedIcon />
              </Button>
            ),
          },
        }}
        fullWidth
      />
    </Box>
  );
}

export function MyReservations() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "active";
  const rawPage = searchParams.get("page");
  const page =
    /^[1-9]\d*$/.test(rawPage ?? "") && Number.isSafeInteger(Number(rawPage))
      ? Number(rawPage)
      : 1;
  const hasFilters = Boolean(q || status !== "active");
  const [retry, setRetry] = useState(0);
  const [sessionVersion, setSessionVersion] = useState(0);
  const requestKey = `${query}|${retry}|${sessionVersion}`;
  const [result, setResult] = useState<{
    key: string;
    data: OwnReservationsResponse | null;
    unauthorized: boolean;
    error: boolean;
  } | null>(null);
  const loading = result?.key !== requestKey;
  const data = loading ? null : result?.data;
  const unauthorized = !loading && result?.unauthorized;
  const error = !loading && result?.error;
  const requestId = useRef(0);
  const [selected, setSelected] = useState<OwnReservation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmationMounted, setConfirmationMounted] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const cancelingRef = useRef(false);
  const detailsFocusRef = useRef<"card" | "search" | null>(null);
  const confirmationFocusRef = useRef<"cancel" | null>(null);
  const detailsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const cancelTriggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onSessionChanged = () => {
      setSelected(null);
      setDetailsOpen(false);
      setConfirmOpen(false);
      setConfirmationMounted(false);
      detailsFocusRef.current = null;
      confirmationFocusRef.current = null;
      setSessionVersion((value) => value + 1);
    };
    window.addEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
    return () =>
      window.removeEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    api
      .get<OwnReservationsResponse>("/reservations", {
        params: { q: q || undefined, status, page },
        signal: controller.signal,
      })
      .then(({ data: response }) => {
        if (currentRequest !== requestId.current || controller.signal.aborted)
          return;
        const lastPage = Math.max(1, response.pagination.totalPages);
        if (page > lastPage || (rawPage !== null && String(page) !== rawPage)) {
          const next = new URLSearchParams(query);
          if (lastPage === 1) next.delete("page");
          else next.set("page", String(lastPage));
          const nextQuery = next.toString();
          router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
            scroll: false,
          });
          return;
        }
        setResult({
          key: requestKey,
          data: response,
          unauthorized: false,
          error: false,
        });
      })
      .catch((caught) => {
        if (currentRequest !== requestId.current || controller.signal.aborted)
          return;
        if (axios.isAxiosError(caught) && caught.response?.status === 401) {
          setResult({
            key: requestKey,
            data: null,
            unauthorized: true,
            error: false,
          });
          return;
        }
        setResult({
          key: requestKey,
          data: null,
          unauthorized: false,
          error: true,
        });
        toast.error("Não foi possível carregar suas reservas.");
      });
    return () => controller.abort();
  }, [
    q,
    status,
    page,
    query,
    retry,
    sessionVersion,
    requestKey,
    rawPage,
    router,
    pathname,
  ]);

  function navigate(updates: Record<string, string>, resetPage = false) {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (resetPage) next.delete("page");
    const nextQuery = next.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }

  function closeDetails() {
    detailsFocusRef.current = "card";
    setDetailsOpen(false);
  }

  function closeConfirmation() {
    if (cancelingRef.current) return;
    confirmationFocusRef.current = "cancel";
    setConfirmOpen(false);
  }

  function onConfirmationExited() {
    setConfirmationMounted(false);
    if (detailsFocusRef.current === "search") {
      setDetailsOpen(false);
    } else if (confirmationFocusRef.current === "cancel") {
      cancelTriggerRef.current?.focus();
    }
    confirmationFocusRef.current = null;
  }

  function onDetailsExited() {
    setSelected(null);
    if (detailsFocusRef.current === "search") searchRef.current?.focus();
    else if (detailsFocusRef.current === "card")
      detailsTriggerRef.current?.focus();
    detailsFocusRef.current = null;
  }

  async function confirmCancel() {
    if (!selected || cancelingRef.current) return;
    cancelingRef.current = true;
    setCanceling(true);
    try {
      await api.patch(`/reservations/${selected.id}/cancel`);
      detailsFocusRef.current = "search";
      confirmationFocusRef.current = null;
      setConfirmOpen(false);
      toast.success("Reserva cancelada. O horário está disponível novamente.");
      setRetry((value) => value + 1);
    } catch (caught) {
      if (axios.isAxiosError(caught) && caught.response?.status === 409) {
        toast.error(
          "Esta reserva não pode mais ser cancelada. Atualize a lista.",
        );
      } else if (
        axios.isAxiosError(caught) &&
        caught.response?.status === 401
      ) {
        toast.error("Sessão encerrada. Entre como um usuário novamente.");
      } else {
        toast.error("Não foi possível cancelar a reserva. Tente novamente.");
      }
    } finally {
      cancelingRef.current = false;
      setCanceling(false);
    }
  }

  return (
    <Container
      component="section"
      maxWidth="xl"
      aria-label="Lista das minhas reservas"
      sx={{ py: { xs: 3, md: 4 } }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 2fr) minmax(0, 1fr) auto",
          },
          gap: 2,
          alignItems: "end",
          p: { xs: 2, md: 3 },
          mb: 2,
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: "0 6px 24px rgba(35,18,45,.06)",
        }}
      >
        <SearchField
          key={q}
          q={q}
          inputRef={searchRef}
          onSearch={(value) => navigate({ q: value }, true)}
        />
        <TextField
          select
          label="Situação"
          value={
            ["active", "completed", "all"].includes(status) ? status : "active"
          }
          onChange={(event) => navigate({ status: event.target.value }, true)}
          fullWidth
        >
          <MenuItem value="active">Ativas</MenuItem>
          <MenuItem value="completed">Concluídas</MenuItem>
          <MenuItem value="all">Todas</MenuItem>
        </TextField>
        {hasFilters && (
          <Button
            onClick={() => navigate({ q: "", status: "", page: "" })}
            color="secondary"
          >
            Limpar filtros
          </Button>
        )}
      </Box>

      {loading ? (
        <Stack spacing={1.5} aria-label="Carregando minhas reservas">
          <span className="visually-hidden">Carregando minhas reservas</span>
          {Array.from({ length: 3 }, (_, index) => (
            <MyReservationCardSkeleton key={index} />
          ))}
        </Stack>
      ) : unauthorized ? (
        <Stack
          spacing={1.5}
          sx={{ py: 7, textAlign: "center", alignItems: "center" }}
        >
          <Typography component="h2" variant="h5">
            Entre como um usuário para ver suas reservas
          </Typography>
          <Typography color="text.secondary">
            Use “Entrar como” no cabeçalho.
          </Typography>
        </Stack>
      ) : error ? (
        <Stack spacing={2} sx={{ py: 7, alignItems: "center" }}>
          <Typography>Não foi possível carregar suas reservas.</Typography>
          <Button
            variant="outlined"
            onClick={() => setRetry((value) => value + 1)}
          >
            Tentar novamente
          </Button>
        </Stack>
      ) : data?.items.length ? (
        <>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {data.pagination.totalItems}{" "}
            {data.pagination.totalItems === 1
              ? "reserva encontrada"
              : "reservas encontradas"}
          </Typography>
          <Stack spacing={1.5}>
            {data.items.slice(0, 10).map((reservation) => (
              <MyReservationCard
                key={reservation.id}
                reservation={reservation}
                onDetails={(trigger) => {
                  detailsTriggerRef.current = trigger;
                  setSelected(reservation);
                  setDetailsOpen(true);
                }}
              />
            ))}
          </Stack>
          {data.pagination.totalPages > 1 && (
            <Stack sx={{ mt: 4, alignItems: "center" }}>
              <Pagination
                aria-label="Páginas das reservas"
                page={page}
                count={data.pagination.totalPages}
                color="primary"
                onChange={(_, nextPage) => navigate({ page: String(nextPage) })}
              />
            </Stack>
          )}
        </>
      ) : hasFilters ? (
        <Stack
          spacing={2}
          sx={{ py: 7, textAlign: "center", alignItems: "center" }}
        >
          <Typography component="h2" variant="h5">
            Nenhuma reserva encontrada
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate({ q: "", status: "", page: "" })}
          >
            Limpar filtros
          </Button>
        </Stack>
      ) : (
        <Stack
          spacing={2}
          sx={{ py: 7, textAlign: "center", alignItems: "center" }}
        >
          <Typography component="h2" variant="h5">
            Você ainda não tem reservas ativas
          </Typography>
          <Typography color="text.secondary">
            Encontre uma sala para sua próxima reunião.
          </Typography>
          <Button component={Link} href="/" variant="contained">
            Reservar uma sala
          </Button>
        </Stack>
      )}
      {selected && (
        <MyReservationDialog
          open={detailsOpen}
          reservation={selected}
          onClose={closeDetails}
          onExited={onDetailsExited}
          onCancel={(trigger) => {
            cancelTriggerRef.current = trigger;
            setConfirmationMounted(true);
            setConfirmOpen(true);
          }}
          cancelButtonRef={cancelTriggerRef}
        />
      )}
      {confirmationMounted && (
        <CancelReservationDialog
          open={confirmOpen}
          submitting={canceling}
          onClose={closeConfirmation}
          onExited={onConfirmationExited}
          onConfirm={() => void confirmCancel()}
        />
      )}
    </Container>
  );
}
