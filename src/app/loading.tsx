import { Container, Skeleton, Stack } from "@mui/material";

export default function Loading() {
  return (
    <Container
      component="main"
      maxWidth="md"
      sx={{ py: { xs: 4, md: 8 } }}
      aria-label="Carregando página inicial"
    >
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={76} />
        <Skeleton variant="rounded" height={340} />
      </Stack>
    </Container>
  );
}
