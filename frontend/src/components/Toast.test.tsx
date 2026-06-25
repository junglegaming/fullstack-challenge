import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, jest, spyOn } from "bun:test";
import { ToastProvider, useToast } from "./Toast";

function Harness() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.show("Falhou feio")}>erro</button>
      <button onClick={() => toast.show("Deu certo", "success")}>ok</button>
    </div>
  );
}

function renderHarness() {
  return render(
    <ToastProvider>
      <Harness />
    </ToastProvider>,
  );
}

describe("ToastProvider", () => {
  it("exibe a notificacao disparada via useToast", () => {
    const { getByText, getByRole } = renderHarness();

    fireEvent.click(getByText("erro"));
    expect(getByRole("alert")).toHaveTextContent("Falhou feio");
  });

  it("remove a notificacao ao clicar nela", () => {
    const { getByText, getByRole, queryByRole } = renderHarness();

    fireEvent.click(getByText("ok"));
    const toast = getByRole("alert");
    expect(toast).toHaveTextContent("Deu certo");

    fireEvent.click(toast);
    expect(queryByRole("alert")).toBeNull();
  });

  it("some sozinha apos o tempo de auto-dismiss", () => {
    jest.useFakeTimers();
    try {
      const { getByText, getByRole, queryByRole } = renderHarness();
      fireEvent.click(getByText("erro"));
      expect(getByRole("alert")).toHaveTextContent("Falhou feio");

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      expect(queryByRole("alert")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("useToast lanca erro fora do provider", () => {
    function Orphan() {
      useToast();
      return null;
    }
    const spy = spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
