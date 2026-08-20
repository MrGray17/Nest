// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ActiveSession } from "../domain/types";
import SessionEndOverlay from "./SessionEndOverlay";

const session: ActiveSession = {
  task: "Write regression tests",
  environmentId: "tokyo",
  sourceId: null,
  durationMinutes: 25,
  startedAt: 1_000,
  runningSince: null,
  accumulatedMs: 60_000,
};

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Complete focus</button>
      {open && (
        <SessionEndOverlay
          session={session}
          now={61_000}
          onExtend={vi.fn()}
          onBreak={vi.fn()}
          onFinish={() => setOpen(false)}
        />
      )}
    </>
  );
}

describe("SessionEndOverlay focus lifecycle", () => {
  it("contains keyboard focus and restores it after completion", () => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Complete focus" });
    opener.focus();
    fireEvent.click(opener);
    const note = screen.getByPlaceholderText("Next: test concurrent transfers");
    const finish = screen.getByRole("button", { name: /Finish/ });
    expect(note).toHaveFocus();

    finish.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(note).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(finish).toHaveFocus();

    fireEvent.click(finish);
    expect(opener).toHaveFocus();
  });
});
