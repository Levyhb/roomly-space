import { Box, Card, Skeleton, Stack } from "@mui/material";

export function MyReservationCardSkeleton() {
  return (
    <Card
      aria-label="Carregando reserva"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "24% 1.3fr 1fr auto auto" },
        alignItems: "center",
        gap: 2,
        p: 1.25,
        borderRadius: 3,
      }}
    >
      <Skeleton
        variant="rounded"
        sx={{ width: "100%", height: { xs: 180, md: 110 } }}
      />
      <Stack spacing={1}>
        <Skeleton width="55%" height={30} />
        <Skeleton width="75%" />
        <Skeleton width="40%" />
      </Stack>
      <Stack spacing={1}>
        <Skeleton width="75%" />
        <Skeleton width="60%" />
      </Stack>
      <Box sx={{ px: 1 }}>
        <Skeleton variant="rounded" width={120} height={32} />
      </Box>
      <Skeleton variant="rounded" width={170} height={38} />
    </Card>
  );
}
