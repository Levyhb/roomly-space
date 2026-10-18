"use client";

import { Box } from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import type { CatalogRoom } from "@/types/room-catalog";

const fallbackImage = "/assets/room-placeholder.png";

export function RoomImage({
  room,
  aspectRatio = "16 / 9",
}: {
  room: CatalogRoom;
  aspectRatio?: string | { xs: string; sm: string };
}) {
  const [image, setImage] = useState(room.imageUrl || fallbackImage);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio,
        bgcolor: "grey.100",
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      <Image
        src={image}
        alt={`Imagem de ${room.name}`}
        fill
        sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 640px"
        style={{ objectFit: "cover" }}
        unoptimized={image !== fallbackImage}
        onError={() => setImage(fallbackImage)}
      />
    </Box>
  );
}
