import { Box, Container, Typography } from "@mui/material";

export function HomeShell() {
  return (
    <Box component="main">
      <Box
        component="section"
        aria-labelledby="rooms-hero-title"
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          minHeight: { xs: 360, md: 330 },
          backgroundColor: "#f9f2ee",
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,.94) 0%, rgba(255,255,255,.78) 43%, rgba(255,255,255,0) 78%), url('/assets/rooms-hero.png')",
          backgroundPosition: { xs: "62% center", md: "center" },
          backgroundSize: "cover",
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
          <Box sx={{ position: "relative", maxWidth: { xs: 410, md: 850 } }}>
            <Typography
              id="rooms-hero-title"
              component="h1"
              variant="h2"
              sx={{
                color: "primary.dark",
                fontSize: {
                  xs: "clamp(2.5rem, 11vw, 4rem)",
                  md: "clamp(3.6rem, 5vw, 5.4rem)",
                },
                lineHeight: 1.06,
                mb: 1.5,
              }}
            >
              Encontre sua sala
            </Typography>
            <Typography
              component="p"
              sx={{
                color: "text.secondary",
                fontSize: { xs: "1.05rem", md: "1.35rem" },
                lineHeight: 1.45,
                maxWidth: 700,
                m: 0,
              }}
            >
              Espaços modernos e equipados para fazer suas ideias acontecerem.
            </Typography>
            <Box
              aria-hidden="true"
              sx={{
                mt: 3,
                width: 48,
                height: 4,
                borderRadius: 2,
                bgcolor: "secondary.main",
              }}
            />
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
