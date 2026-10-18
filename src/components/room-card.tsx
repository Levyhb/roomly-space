"use client";

import AccessibleOutlinedIcon from "@mui/icons-material/AccessibleOutlined";
import CoffeeOutlinedIcon from "@mui/icons-material/CoffeeOutlined";
import ConnectedTvOutlinedIcon from "@mui/icons-material/ConnectedTvOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PersonalVideoOutlinedIcon from "@mui/icons-material/PersonalVideoOutlined";
import TvOutlinedIcon from "@mui/icons-material/TvOutlined";
import ViewQuiltOutlinedIcon from "@mui/icons-material/ViewQuiltOutlined";
import { Box, Button, Card, Chip, Stack, Typography } from "@mui/material";
import { RoomImage } from "@/components/room-image";
import type { CatalogRoom } from "@/types/room-catalog";

const resourceIcons: Record<string, typeof MeetingRoomOutlinedIcon> = {
  accessibility: AccessibleOutlinedIcon,
  coffee: CoffeeOutlinedIcon,
  projector: PersonalVideoOutlinedIcon,
  tv: TvOutlinedIcon,
  whiteboard: ViewQuiltOutlinedIcon,
  video: ConnectedTvOutlinedIcon,
};

export function RoomCard({
  room,
  onReserve,
  checking = false,
}: {
  room: CatalogRoom;
  onReserve?: (trigger: HTMLButtonElement) => void;
  checking?: boolean;
}) {
  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: 3,
      }}
    >
      <RoomImage room={room} />
      <Stack spacing={1.5} sx={{ p: 2.5, flex: 1 }}>
        <Box>
          <Typography component="h3" variant="h6" sx={{ fontWeight: 700 }}>
            {room.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {room.address}
          </Typography>
        </Box>
        <Typography variant="body2">Até {room.capacity} pessoas</Typography>
        <Stack
          direction="row"
          useFlexGap
          sx={{ flexWrap: "wrap", gap: 0.75 }}
          aria-label="Recursos da sala"
        >
          {room.resources.map((resource) => {
            const Icon =
              resourceIcons[resource.code] ?? MeetingRoomOutlinedIcon;
            return (
              <Chip
                key={resource.code}
                size="small"
                label={resource.name}
                icon={<Icon fontSize="small" />}
                variant="outlined"
              />
            );
          })}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {room.description}
        </Typography>
        <Button
          variant="contained"
          fullWidth
          disabled={!onReserve || checking}
          onClick={(event) => onReserve?.(event.currentTarget)}
        >
          {checking ? "Verificando..." : "Reservar"}
        </Button>
      </Stack>
    </Card>
  );
}
