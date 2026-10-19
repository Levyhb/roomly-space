import { Box, Container, Typography } from "@mui/material";
import { Suspense } from "react";
import { MyReservations } from "@/components/my-reservations";
import { RoomlyMark } from "@/components/roomly-mark";

export default function MyReservationsPage() {
  return (
    <Box component="main">
      <Box
        component="section"
        aria-labelledby="my-reservations-title"
        sx={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(115deg, #fff 35%, #f8efe9 100%)",
          py: { xs: 5, md: 7 },
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            right: { xs: -55, md: "9%" },
            top: { xs: 5, md: -25 },
            color: "primary.main",
            opacity: { xs: 0.1, md: 0.18 },
            pointerEvents: "none",
          }}
        >
          <RoomlyMark size={250} />
        </Box>
        <Container maxWidth="xl" sx={{ position: "relative" }}>
          <Typography
            id="my-reservations-title"
            component="h1"
            variant="h2"
            sx={{
              color: "primary.dark",
              fontSize: {
                xs: "clamp(2.5rem, 10vw, 4rem)",
                md: "clamp(3.8rem, 5vw, 5.4rem)",
              },
              lineHeight: 1.05,
              fontWeight: 750,
            }}
          >
            Minhas reservas
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: { xs: "1.05rem", md: "1.35rem" },
              mt: 1.5,
            }}
          >
            Acompanhe suas reservas e consulte os detalhes de cada encontro.
          </Typography>
        </Container>
      </Box>
      <Suspense fallback={null}>
        <MyReservations />
      </Suspense>
    </Box>
  );
}
