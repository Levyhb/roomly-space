"use client";

import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  CircularProgress,
  Container,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Toolbar,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/services/api/client";
import type { SessionUser } from "@/types/session";

type AppHeaderProps = {
  users: SessionUser[];
  initialUser: SessionUser | null;
};

const navigation = [
  { label: "Salas", href: "/" },
  { label: "Minhas reservas", href: "/my-reservations" },
  { label: "Admin", href: "/admin" },
];

export function AppHeader({ users, initialUser }: AppHeaderProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isSwitching, setIsSwitching] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      const message = "Não foi possível trocar de usuário. Tente novamente.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSwitching(false);
    }
  }

  const sessionStatus = error
    ? error
    : isSwitching
      ? "Atualizando usuário..."
      : currentUser
        ? `Sessão de ${currentUser.name} · ${currentUser.role === "ADMIN" ? "Admin" : "Usuário"}`
        : "Escolha um usuário para começar.";

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        component="header"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{ minHeight: { xs: 72, md: 82 }, gap: { xs: 1, sm: 2 } }}
          >
            <IconButton
              aria-label="Abrir menu"
              aria-controls="mobile-navigation"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              edge="start"
              sx={{ display: { md: "none" }, color: "primary.dark" }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              component={Link}
              href="/"
              aria-label="Roomly Space, página inicial"
              sx={{
                display: "flex",
                alignItems: "center",
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              <Image
                src="/assets/roomly-wordmark.png"
                alt="Roomly Space"
                width={240}
                height={45}
                priority
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: 54,
                }}
              />
            </Box>

            <Box
              component="nav"
              aria-label="Navegação principal"
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "stretch",
                justifyContent: "center",
                gap: 1,
                flex: 1,
                height: 82,
              }}
            >
              {navigation.map((item) => {
                const active = pathname === item.href;
                return (
                  <Box
                    key={item.href}
                    component={Link}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    sx={{
                      alignContent: "center",
                      px: 2,
                      borderBottom: "3px solid",
                      borderColor: active ? "secondary.main" : "transparent",
                      color: active ? "primary.dark" : "text.secondary",
                      fontWeight: active ? 700 : 500,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    {item.label}
                  </Box>
                );
              })}
            </Box>

            <Box
              sx={{
                ml: { xs: "auto", md: 0 },
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {isSwitching && (
                <CircularProgress size={18} aria-label="Atualizando usuário" />
              )}
              <FormControl
                size="small"
                sx={{
                  minWidth: { xs: 108, sm: 170 },
                  maxWidth: { xs: 140, sm: 220 },
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
                  {currentUser && <MenuItem value="0">Sair da sessão</MenuItem>}
                  {users.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.name} {user.role === "ADMIN" ? "(Admin)" : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Toolbar>
        </Container>
        <Box id="session-status" className="visually-hidden" aria-live="polite">
          {sessionStatus}
        </Box>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{ paper: { id: "mobile-navigation" } }}
        sx={{ display: { md: "none" } }}
      >
        <Box
          component="nav"
          aria-label="Navegação móvel"
          sx={{ width: 270, pt: 2 }}
        >
          <List>
            {navigation.map((item) => {
              const active = pathname === item.href;
              return (
                <ListItemButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  selected={active}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setDrawerOpen(false)}
                  sx={{ px: 3, minHeight: 52 }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
