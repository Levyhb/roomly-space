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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { RoomCard } from "@/components/room-card";
import { RoomCardSkeleton } from "@/components/room-card-skeleton";
import { api } from "@/services/api/client";
import type {
  ResourceOptionsResponse,
  RoomCatalogResponse,
  RoomResource,
} from "@/types/room-catalog";

const capacityOptions = [
  { value: "2-4", label: "2 a 4 pessoas" },
  { value: "5-8", label: "5 a 8 pessoas" },
  { value: "9-12", label: "9 a 12 pessoas" },
  { value: "13-plus", label: "13 ou mais pessoas" },
];

function RoomGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        gap: 3,
      }}
    >
      {children}
    </Box>
  );
}

function SearchField({
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
        label="Buscar por nome"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <Button
                type="submit"
                aria-label="Buscar salas"
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

export function RoomCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const q = searchParams.get("q") ?? "";
  const capacity = searchParams.get("capacity") ?? "";
  const resource = searchParams.get("resource") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const hasFilters = Boolean(q || capacity || resource);
  const [resources, setResources] = useState<RoomResource[]>([]);
  const [resourceRetry, setResourceRetry] = useState(0);
  const [retry, setRetry] = useState(0);
  const requestKey = `${query}|${retry}`;
  const [result, setResult] = useState<{
    key: string;
    catalog: RoomCatalogResponse | null;
    error: boolean;
  } | null>(null);
  const loading = result?.key !== requestKey;
  const catalog = loading ? null : result.catalog;
  const error = !loading && result.error;
  const requestId = useRef(0);
  const resourceOptions =
    resource && !resources.some((item) => item.code === resource)
      ? [{ code: resource, name: resource }, ...resources]
      : resources;

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<ResourceOptionsResponse>("/resources", { signal: controller.signal })
      .then(({ data }) => setResources(data.items))
      .catch(() => {
        if (!controller.signal.aborted) {
          toast.error(
            <Stack spacing={1}>
              <span>Não foi possível carregar os recursos.</span>
              <Button
                size="small"
                color="inherit"
                onClick={() => setResourceRetry((value) => value + 1)}
              >
                Tentar novamente
              </Button>
            </Stack>,
          );
        }
      });
    return () => controller.abort();
  }, [resourceRetry]);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = ++requestId.current;

    api
      .get<RoomCatalogResponse>("/rooms", {
        params: {
          q: q || undefined,
          capacity: capacity || undefined,
          resource: resource || undefined,
          page,
        },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (
          currentRequest === requestId.current &&
          !controller.signal.aborted
        ) {
          const lastPage = Math.max(1, data.pagination.totalPages);
          if (page > lastPage) {
            const next = new URLSearchParams(query);
            if (lastPage === 1) next.delete("page");
            else next.set("page", String(lastPage));
            const nextQuery = next.toString();
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
              scroll: false,
            });
            return;
          }
          setResult({ key: requestKey, catalog: data, error: false });
        }
      })
      .catch(() => {
        if (
          currentRequest === requestId.current &&
          !controller.signal.aborted
        ) {
          setResult({ key: requestKey, catalog: null, error: true });
          toast.error(
            <Stack spacing={1}>
              <span>Não foi possível carregar as salas.</span>
              <Button
                size="small"
                color="inherit"
                onClick={() => setRetry((value) => value + 1)}
              >
                Tentar novamente
              </Button>
            </Stack>,
          );
        }
      });
    return () => controller.abort();
  }, [q, capacity, resource, page, retry, requestKey, query, router, pathname]);

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

  function clearFilters() {
    navigate({ q: "", capacity: "", resource: "", page: "" });
  }

  return (
    <Container
      component="section"
      maxWidth="xl"
      aria-labelledby="catalog-title"
      sx={{ py: { xs: 5, md: 7 } }}
    >
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography
          id="catalog-title"
          component="h2"
          variant="h4"
          sx={{ fontWeight: 700, color: "primary.dark" }}
        >
          Salas disponíveis
        </Typography>
        <Typography color="text.secondary">
          Encontre o espaço ideal para sua próxima reunião.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 2fr) repeat(2, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <SearchField
          key={q}
          q={q}
          onSearch={(value) => navigate({ q: value }, true)}
        />
        <TextField
          select
          label="Capacidade"
          value={capacity}
          onChange={(event) => navigate({ capacity: event.target.value }, true)}
          fullWidth
        >
          <MenuItem value="">Todas as capacidades</MenuItem>
          {capacityOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
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
          {resourceOptions.map((option) => (
            <MenuItem key={option.code} value={option.code}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <RoomGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <RoomCardSkeleton key={index} />
          ))}
        </RoomGrid>
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
      ) : catalog?.items.length ? (
        <>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {catalog.pagination.totalItems}{" "}
            {catalog.pagination.totalItems === 1
              ? "sala encontrada"
              : "salas encontradas"}
          </Typography>
          <RoomGrid>
            {catalog.items.slice(0, 12).map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </RoomGrid>
          {catalog.pagination.totalPages > 1 && (
            <Stack sx={{ mt: 4, alignItems: "center" }}>
              <Pagination
                aria-label="Páginas das salas"
                page={page}
                count={catalog.pagination.totalPages}
                color="primary"
                onChange={(_, nextPage) => navigate({ page: String(nextPage) })}
              />
            </Stack>
          )}
        </>
      ) : (
        <Stack
          spacing={2}
          sx={{ py: 7, textAlign: "center", alignItems: "center" }}
        >
          <MeetingEmpty hasFilters={hasFilters} onClear={clearFilters} />
        </Stack>
      )}
    </Container>
  );
}

function MeetingEmpty({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <>
      <Typography component="h3" variant="h6">
        {hasFilters ? "Nenhuma sala encontrada" : "Nenhuma sala cadastrada"}
      </Typography>
      {hasFilters && (
        <Button variant="outlined" onClick={onClear}>
          Limpar filtros
        </Button>
      )}
    </>
  );
}
