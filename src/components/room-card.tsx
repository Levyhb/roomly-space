"use client";

import AccessibleOutlinedIcon from "@mui/icons-material/AccessibleOutlined";
import CoffeeOutlinedIcon from "@mui/icons-material/CoffeeOutlined";
import ConnectedTvOutlinedIcon from "@mui/icons-material/ConnectedTvOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PersonalVideoOutlinedIcon from "@mui/icons-material/PersonalVideoOutlined";
import TvOutlinedIcon from "@mui/icons-material/TvOutlined";
import ViewQuiltOutlinedIcon from "@mui/icons-material/ViewQuiltOutlined";
import { Box, Button, Card, Chip, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import type { CatalogRoom } from "@/types/room-catalog";

const fallbackImage = "/assets/room-placeholder.png";

const resourceIcons: Record<string, typeof MeetingRoomOutlinedIcon> = {
  accessibility: AccessibleOutlinedIcon,
  coffee: CoffeeOutlinedIcon,
  projector: PersonalVideoOutlinedIcon,
  tv: TvOutlinedIcon,
  whiteboard: ViewQuiltOutlinedIcon,
  video: ConnectedTvOutlinedIcon,
};

export function RoomCard({ room }: { room: CatalogRoom }) {
  const [image, setImage] = useState(room.imageUrl || fallbackImage);

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
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          bgcolor: "grey.100",
        }}
      >
        <Image
          src={image}
          alt={`Imagem de ${room.name}`}
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
          style={{ objectFit: "cover" }}
          unoptimized={image !== fallbackImage}
          onError={() => setImage(fallbackImage)}
        />
      </Box>
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
        <Button variant="contained" fullWidth disabled>
          Reservar
        </Button>
      </Stack>
    </Card>
  );
}
