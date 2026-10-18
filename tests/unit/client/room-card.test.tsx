/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { RoomCard } from "@/components/room-card";
import { makeRoom } from "../../helpers/factories/room-factory";

test("TC_SALA_1_018 - card mostra dados e fallback sem liberar reserva", () => {
  render(<RoomCard room={makeRoom()} />);

  expect(screen.getByRole("heading", { name: "Sala Ipê" })).toBeVisible();
  expect(screen.getByText("Torre A · 3º andar")).toBeVisible();
  expect(screen.getByText("Até 8 pessoas")).toBeVisible();
  expect(screen.getByText("Projetor")).toBeVisible();
  expect(screen.getByText("Espaço para reuniões de equipe.")).toBeVisible();
  expect(
    screen.getByRole("img", { name: "Imagem de Sala Ipê" }),
  ).toHaveAttribute("src", expect.stringContaining("room-placeholder.png"));
  expect(screen.getByRole("button", { name: "Reservar" })).toBeDisabled();
});

test("TC_SALA_1_019 - imagem com erro troca para o fallback local", () => {
  render(
    <RoomCard
      room={makeRoom({ imageUrl: "https://example.com/broken.png" })}
    />,
  );
  const image = screen.getByRole("img", { name: "Imagem de Sala Ipê" });
  fireEvent.error(image);
  expect(image).toHaveAttribute(
    "src",
    expect.stringContaining("room-placeholder.png"),
  );
});
