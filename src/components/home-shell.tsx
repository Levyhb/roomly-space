"use client";

import {
  Alert,
  AppBar,
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useState } from "react";
import { RoomlyMark } from "@/components/roomly-mark";
import { api } from "@/services/api/client";

export type SessionUser = {
  id: number;
  name: string;
  role: "USER" | "ADMIN";
};

type HomeShellProps = {
  users: SessionUser[];
  initialUser: SessionUser | null;
};

export function HomeShell({ users, initialUser }: HomeShellProps) {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeUser(event: SelectChangeEvent<string>) {
    const userId = Number(event.target.value);
    setIsSwitching(true);
    setError(null);

    try {
      if (userId === 0) {
        await api.delete("/session");
        setCurrentUser(null);
      } else {
        const response = await api.post<{ user: SessionUser }>("/session", {
          userId,
        });
        setCurrentUser(response.data.user);
      }
    } catch {
      setError("Não foi possível trocar de usuário. Tente novamente.");
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        color="inherit"
        component="header"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 76, md: 84 },
              gap: 2,
              flexWrap: { xs: "wrap", md: "nowrap" },
              py: { xs: 1.5, md: 0 },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                color: "primary.main",
                flexShrink: 0,
              }}
            >
              <RoomlyMark />
              <Typography
                variant="h6"
                component="span"
                sx={{ fontWeight: 800 }}
              >
                Roomly Space
              </Typography>
            </Stack>

            <FormControl
              size="small"
              sx={{
                ml: "auto",
                minWidth: { xs: 160, sm: 190 },
              }}
            >
              <InputLabel id="user-select-label">Entrar como</InputLabel>
              <Select
                labelId="user-select-label"
                id="user-select"
                label="Entrar como"
                value={currentUser ? String(currentUser.id) : ""}
                onChange={changeUser}
                disabled={isSwitching}
                aria-describedby="session-status"
              >
                {currentUser && <MenuItem value="">Sair da sessão</MenuItem>}
                {users.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.name} {user.role === "ADMIN" ? "(Admin)" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Toolbar>
        </Container>
      </AppBar>

      <Container component="main" maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Paper
          sx={{
            position: "relative",
            overflow: "hidden",
            minHeight: { xs: 280, md: 340 },
            borderRadius: 3,
            background: "linear-gradient(120deg, #fff 35%, #f5edf2 100%)",
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            p: { xs: 3, md: 5 },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1, maxWidth: 700 }}>
            <Typography
              component="h1"
              variant="h2"
              sx={{ fontSize: { xs: "2.4rem", md: "3.7rem" }, mb: 1.5 }}
            >
              Roomly Space
            </Typography>
            <Typography
              component="p"
              variant="h6"
              color="text.secondary"
              sx={{ fontWeight: 400 }}
            >
              Sistema interno para organizar reservas de salas de reunião.
            </Typography>
          </Box>
          <Box
            aria-hidden="true"
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              right: "9%",
              bottom: -30,
              width: 160,
              height: 215,
              border: "12px solid",
              borderColor: "primary.main",
              borderBottom: 0,
              borderRadius: "80px 80px 0 0",
              transform: "rotate(-8deg)",
              opacity: 0.9,
            }}
          />
        </Paper>

        <Box
          id="session-status"
          aria-live="polite"
          sx={{ mt: 2, minHeight: 26 }}
        >
          {isSwitching && (
            <Typography color="text.secondary">
              Atualizando usuário...
            </Typography>
          )}
          {!isSwitching && currentUser && (
            <Typography color="text.secondary">
              Sessão de {currentUser.name} ·{" "}
              {currentUser.role === "ADMIN" ? "Admin" : "Usuário"}
            </Typography>
          )}
          {!isSwitching && !currentUser && (
            <Typography color="text.secondary">
              Escolha um usuário para começar.
            </Typography>
          )}
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Container>
    </>
  );
}
