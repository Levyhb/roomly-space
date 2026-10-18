/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoomCard } from "@/components/room-card";
import { makeRoom } from "../../../helpers/factories/room-factory";

test("TC_SALA_2_037 - card habilita Reservar e informa o botão acionado", async () => {
  const onReserve = jest.fn();
  render(<RoomCard room={makeRoom()} onReserve={onReserve} />);
  const trigger = screen.getByRole("button", { name: "Reservar" });
  expect(trigger).toBeEnabled();
  await userEvent.setup().click(trigger);
  expect(onReserve).toHaveBeenCalledWith(trigger);
});
