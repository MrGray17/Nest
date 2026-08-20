// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import PanelShell from "./PanelShell";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open history</button>
      {open && <PanelShell eyebrow="A quiet record" title="History" onClose={() => setOpen(false)}>History content</PanelShell>}
    </>
  );
}

describe("PanelShell focus lifecycle", () => {
  it("moves focus into the panel and restores it to the opener", () => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Open history" });
    opener.focus();
    fireEvent.click(opener);
    const close = screen.getByRole("button", { name: "Close History" });
    expect(close).toHaveFocus();
    expect(screen.getByRole("dialog", { name: "History" })).toBeInTheDocument();
    fireEvent.click(close);
    expect(opener).toHaveFocus();
  });
});
