import { Box, Card, Skeleton, Stack } from "@mui/material";

export function RoomCardSkeleton() {
  return (
    <Card
      aria-label="Carregando sala"
      variant="outlined"
      sx={{ borderRadius: 3, height: "100%" }}
    >
      <Box sx={{ aspectRatio: "16 / 9" }}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
      <Stack spacing={1.5} sx={{ p: 2.5 }}>
        <Skeleton variant="text" width="70%" height={32} />
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="35%" />
        <Skeleton variant="rounded" width="65%" height={28} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="rounded" width="100%" height={36} />
      </Stack>
    </Card>
  );
}
