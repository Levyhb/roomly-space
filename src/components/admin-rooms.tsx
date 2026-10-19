"use client";

import AddIcon from "@mui/icons-material/Add";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AdminRoomDialog } from "@/components/admin-room-dialog";
import { roomAddress } from "@/components/room-address";
import { api } from "@/services/api/client";
import type {
  AdminRoom,
  AdminRoomInput,
  AdminRoomsResponse,
} from "@/types/admin-room";
import type { ResourceOptionsResponse } from "@/types/room-catalog";
import { SESSION_CHANGED_EVENT } from "@/types/session";
import type { SessionUser } from "@/types/session";

const capacityOptions = [
  { value: "2-4", label: "2 a 4 pessoas" },
  { value: "5-8", label: "5 a 8 pessoas" },
  { value: "9-12", label: "9 a 12 pessoas" },
  { value: "13-plus", label: "13 ou mais pessoas" },
];

function AdminSearch({
  q,
  onSearch,
}: {
  q: string;
  onSearch: (value: string) => void;
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
        value={value}
        onChange={(event) => setValue(event.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <Button type="submit" aria-label="Buscar salas">
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

function AdminTableSkeleton() {
  return (
    <TableContainer
      component={Paper}
      aria-label="Carregando salas administrativas"
      sx={{ overflowX: "auto" }}
    >
      <Table sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            {["Nome da sala", "Endereço", "Capacidade", "Ações"].map(
              (label) => (
                <TableCell key={label}>{label}</TableCell>
              ),
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 4 }, (_, index) => (
            <TableRow key={index} aria-label="Carregando sala">
              <TableCell>
                <Skeleton width="70%" />
              </TableCell>
              <TableCell>
                <Skeleton width="80%" />
              </TableCell>
              <TableCell>
                <Skeleton width={90} />
              </TableCell>
              <TableCell>
                <Skeleton width={40} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function AdminRooms() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const q = searchParams.get("q") ?? "";
  const capacity = searchParams.get("capacity") ?? "";
  const resource = searchParams.get("resource") ?? "";
  const rawPage = searchParams.get("page");
  const page =
    /^[1-9]\d*$/.test(rawPage ?? "") && Number.isSafeInteger(Number(rawPage))
      ? Number(rawPage)
      : 1;
  const hasFilters = Boolean(q || capacity || resource);
  const [retry, setRetry] = useState(0);
  const [resourceRetry, setResourceRetry] = useState(0);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [checkingSession, setCheckingSession] = useState(false);
  const requestKey = `${query}|${retry}|${sessionVersion}`;
  const [result, setResult] = useState<{
    key: string;
    data: AdminRoomsResponse | null;
    error: boolean;
  } | null>(null);
  const loading = checkingSession || result?.key !== requestKey;
  const data = loading ? null : result?.data;
  const error = !loading && result?.error;
  const [resources, setResources] = useState<ResourceOptionsResponse["items"]>(
    [],
  );
  const [resourcesError, setResourcesError] = useState(false);
  const requestId = useRef(0);
  const sessionRequestId = useRef(0);
  const sessionController = useRef<AbortController | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuRoom, setMenuRoom] = useState<AdminRoom | null>(null);
  const [formRoom, setFormRoom] = useState<AdminRoom | "new" | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formTriggerRef = useRef<HTMLButtonElement | null>(null);
  const newButtonRef = useRef<HTMLButtonElement | null>(null);
  const saveRequestId = useRef(0);

  useEffect(() => {
    function onSessionChanged() {
      setSessionVersion((value) => value + 1);
      setCheckingSession(true);
      setFormOpen(false);
      setMenuAnchor(null);
      saveRequestId.current += 1;
      savingRef.current = false;
      setSaving(false);
      sessionController.current?.abort();
      const controller = new AbortController();
      sessionController.current = controller;
      const current = ++sessionRequestId.current;
      api
        .get<{ user: SessionUser }>("/session", { signal: controller.signal })
        .then(({ data: session }) => {
          if (controller.signal.aborted || current !== sessionRequestId.current)
            return;
          if (session.user.role !== "ADMIN") router.replace("/");
          else setCheckingSession(false);
        })
        .catch(() => {
          if (controller.signal.aborted || current !== sessionRequestId.current)
            return;
          router.replace("/");
        });
    }
    window.addEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
      sessionRequestId.current += 1;
      sessionController.current?.abort();
    };
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<ResourceOptionsResponse>("/resources", { signal: controller.signal })
      .then(({ data: response }) => {
        if (!controller.signal.aborted) {
          setResources(response.items);
          setResourcesError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setResourcesError(true);
      });
    return () => controller.abort();
  }, [resourceRetry]);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++requestId.current;
    api
      .get<AdminRoomsResponse>("/admin/rooms", {
        params: {
          q: q || undefined,
          capacity: capacity || undefined,
          resource: resource || undefined,
          page,
        },
        signal: controller.signal,
      })
      .then(({ data: response }) => {
        if (controller.signal.aborted || current !== requestId.current) return;
        const lastPage = Math.max(1, response.pagination.totalPages);
        const targetPage = Math.min(page, lastPage);
        if (page > lastPage || (rawPage !== null && String(page) !== rawPage)) {
          const next = new URLSearchParams(query);
          if (targetPage === 1) next.delete("page");
          else next.set("page", String(targetPage));
          const nextQuery = next.toString();
          router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
            scroll: false,
          });
          return;
        }
        setResult({ key: requestKey, data: response, error: false });
      })
      .catch((caught) => {
        if (controller.signal.aborted || current !== requestId.current) return;
        if (
          axios.isAxiosError(caught) &&
          [401, 403].includes(caught.response?.status ?? 0)
        ) {
          router.replace("/");
          return;
        }
        setResult({ key: requestKey, data: null, error: true });
        toast.error("Não foi possível carregar as salas.");
      });
    return () => controller.abort();
  }, [
    q,
    capacity,
    resource,
    page,
    rawPage,
    query,
    retry,
    sessionVersion,
    requestKey,
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

  function openForm(room: AdminRoom | "new", trigger: HTMLButtonElement) {
    formTriggerRef.current = trigger;
    setMenuAnchor(null);
    setFormError(null);
    setFormRoom(room);
    setFormOpen(true);
  }

  function closeForm() {
    if (savingRef.current) return;
    setFormOpen(false);
  }

  async function submitForm(input: AdminRoomInput) {
    if (savingRef.current || !formRoom) return;
    savingRef.current = true;
    setSaving(true);
    setFormError(null);
    const current = ++saveRequestId.current;
    try {
      if (formRoom === "new") await api.post("/admin/rooms", input);
      else await api.patch(`/admin/rooms/${formRoom.id}`, input);
      if (current !== saveRequestId.current) return;
      setFormOpen(false);
      setRetry((value) => value + 1);
      toast.success(
        formRoom === "new" ? "Sala cadastrada." : "Sala atualizada.",
      );
    } catch (caught) {
      if (current !== saveRequestId.current) return;
      if (
        axios.isAxiosError(caught) &&
        [401, 403].includes(caught.response?.status ?? 0)
      ) {
        router.replace("/");
        return;
      }
      const message =
        axios.isAxiosError(caught) && caught.response?.status === 409
          ? "Já existe uma sala com esse nome."
          : "Não foi possível salvar a sala. Revise os dados e tente novamente.";
      setFormError(message);
      toast.error(message);
    } finally {
      if (current === saveRequestId.current) {
        savingRef.current = false;
        setSaving(false);
      }
    }
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 3, md: 5 },
        px: { xs: 2, sm: 3, lg: 5 },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: "space-between",
          alignItems: { sm: "center" },
        }}
      >
        <Box>
          <Typography
            component="h1"
            variant="h3"
            sx={{ color: "primary.dark", fontWeight: 750 }}
          >
            Administração de salas
          </Typography>
          <Typography color="text.secondary">
            Cadastre e atualize os espaços disponíveis.
          </Typography>
        </Box>
        <Button
          ref={newButtonRef}
          startIcon={<AddIcon />}
          variant="contained"
          onClick={(event) => openForm("new", event.currentTarget)}
          sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}
        >
          Nova sala
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 2fr) repeat(2, minmax(0, 1fr)) auto",
          },
          gap: 2,
          p: { xs: 2, md: 3 },
          mb: 3,
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: "0 6px 24px rgba(35,18,45,.06)",
        }}
      >
        <AdminSearch
          key={q}
          q={q}
          onSearch={(value) => navigate({ q: value }, true)}
        />
        <TextField
          select
          label="Capacidade"
          value={
            capacityOptions.some((item) => item.value === capacity)
              ? capacity
              : ""
          }
          onChange={(event) => navigate({ capacity: event.target.value }, true)}
          fullWidth
        >
          <MenuItem value="">Todas as capacidades</MenuItem>
          {capacityOptions.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Recurso"
          value={resource}
          onChange={(event) => navigate({ resource: event.target.value }, true)}
          fullWidth
        >
          <MenuItem value="">Todos os recursos</MenuItem>
          {resource && !resources.some((item) => item.code === resource) && (
            <MenuItem value={resource}>{resource}</MenuItem>
          )}
          {resources.map((item) => (
            <MenuItem key={item.id} value={item.code}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>
        {hasFilters && (
          <Button
            onClick={() =>
              navigate({ q: "", capacity: "", resource: "", page: "" })
            }
          >
            Limpar filtros
          </Button>
        )}
      </Box>
      {resourcesError && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
          <Typography role="alert">
            Não foi possível carregar os recursos.
          </Typography>
          <Button onClick={() => setResourceRetry((value) => value + 1)}>
            Tentar novamente
          </Button>
        </Stack>
      )}

      {loading ? (
        <AdminTableSkeleton />
      ) : error ? (
        <Stack spacing={2} sx={{ py: 7, alignItems: "center" }}>
          <Typography>Não foi possível carregar as salas.</Typography>
          <Button
            variant="outlined"
            onClick={() => setRetry((value) => value + 1)}
          >
            Tentar novamente
          </Button>
        </Stack>
      ) : data?.items.length ? (
        <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: "fit-content",
              mx: "auto",
              mb: 2,
              px: 2,
              py: 1,
              alignItems: "center",
              border: "1px solid",
              borderColor: "rgba(38, 11, 72, 0.18)",
              borderRadius: 2,
              bgcolor: "background.paper",
            }}
          >
            <ErrorOutlineIcon color="primary" fontSize="small" />
            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
              {data.pagination.totalItems}{" "}
              {data.pagination.totalItems === 1
                ? "sala cadastrada"
                : "salas cadastradas"}
            </Typography>
          </Stack>
          <TableContainer
            component={Paper}
            sx={{
              overflowX: "auto",
              width: "100%",
              maxWidth: 1200,
              mx: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              boxShadow: "0 6px 24px rgba(35,18,45,.06)",
            }}
          >
            <Table
              sx={{ minWidth: 900, tableLayout: "fixed" }}
              aria-label="Salas cadastradas"
            >
              <colgroup>
                <col style={{ width: "32%" }} />
                <col />
                <col style={{ width: 160 }} />
                <col style={{ width: 72 }} />
              </colgroup>
              <TableHead>
                <TableRow
                  sx={{
                    "& .MuiTableCell-head": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      fontWeight: 700,
                    },
                    "& .MuiTableCell-head:not(:last-of-type)": {
                      borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                    },
                  }}
                >
                  <TableCell>Nome da sala</TableCell>
                  <TableCell>Endereço</TableCell>
                  <TableCell>Capacidade</TableCell>
                  <TableCell
                    sx={{
                      position: "sticky",
                      right: 0,
                      width: 72,
                      minWidth: 72,
                      maxWidth: 72,
                      px: 1,
                      textAlign: "center",
                      bgcolor: "primary.main",
                      zIndex: 2,
                    }}
                  >
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.slice(0, 10).map((room) => {
                  const address = roomAddress(room);

                  return (
                    <TableRow
                      key={room.id}
                      hover
                      sx={{
                        "& .MuiTableCell-root:not(:last-of-type)": {
                          borderRight: "1px solid rgba(38, 11, 72, 0.1)",
                        },
                      }}
                    >
                      <TableCell
                        title={room.name}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 700,
                        }}
                      >
                        {room.name}
                      </TableCell>
                      <TableCell
                        title={address}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {address}
                      </TableCell>
                      <TableCell
                        title={`${room.capacity} pessoas`}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {room.capacity} pessoas
                      </TableCell>
                      <TableCell
                        sx={{
                          position: "sticky",
                          right: 0,
                          width: 72,
                          minWidth: 72,
                          maxWidth: 72,
                          px: 1,
                          textAlign: "center",
                          bgcolor: "background.paper",
                          zIndex: 1,
                        }}
                      >
                        <IconButton
                          aria-label={`Ações para ${room.name}`}
                          onClick={(event) => {
                            setMenuAnchor(event.currentTarget);
                            setMenuRoom(room);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack sx={{ mt: 3, alignItems: "center" }}>
            <Pagination
              aria-label="Páginas das salas"
              count={Math.max(1, data.pagination.totalPages)}
              page={page}
              onChange={(_, nextPage) => navigate({ page: String(nextPage) })}
              color="primary"
            />
          </Stack>
        </Box>
      ) : hasFilters ? (
        <Stack spacing={2} sx={{ py: 7, alignItems: "center" }}>
          <Typography component="h2" variant="h5">
            Nenhuma sala encontrada
          </Typography>
          <Button
            variant="outlined"
            onClick={() =>
              navigate({ q: "", capacity: "", resource: "", page: "" })
            }
          >
            Limpar filtros
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ py: 7, alignItems: "center" }}>
          <Typography component="h2" variant="h5">
            Nenhuma sala cadastrada
          </Typography>
          <Button onClick={(event) => openForm("new", event.currentTarget)}>
            Cadastrar primeira sala
          </Button>
        </Stack>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        disableRestoreFocus
      >
        <MenuItem
          onClick={() => {
            if (menuRoom && menuAnchor)
              openForm(menuRoom, menuAnchor as HTMLButtonElement);
          }}
        >
          Editar
        </MenuItem>
        <MenuItem disabled>Remover</MenuItem>
      </Menu>
      {formRoom && (
        <AdminRoomDialog
          key={formRoom === "new" ? "new" : formRoom.id}
          open={formOpen}
          room={formRoom === "new" ? null : formRoom}
          resources={resources}
          saving={saving}
          serverError={formError}
          onClose={closeForm}
          onExited={() => {
            setFormRoom(null);
            const target = formTriggerRef.current;
            if (target?.isConnected) target.focus();
            else newButtonRef.current?.focus();
          }}
          onSubmit={submitForm}
        />
      )}
    </Container>
  );
}
