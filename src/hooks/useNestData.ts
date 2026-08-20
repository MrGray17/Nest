import { useCallback, useEffect, useRef, useState } from "react";
import type { NestData } from "../domain/types";
import { loadNestData, saveNestData } from "../persistence/nestRepository";

type DataState = {
  data: NestData | null;
  error: string | null;
};

export function useNestData() {
  const [state, setState] = useState<DataState>({ data: null, error: null });
  const hydrated = useRef(false);
  const dataRef = useRef<NestData | null>(null);
  dataRef.current = state.data;

  useEffect(() => {
    let alive = true;
    void loadNestData()
      .then((data) => {
        if (!alive) return;
        hydrated.current = true;
        setState({ data, error: null });
      })
      .catch(() => {
        if (alive) setState({ data: null, error: "Nest couldn't open its local notebook." });
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!hydrated.current || !state.data) return;
    const id = window.setTimeout(() => {
      void saveNestData(state.data!).catch(() => {
        setState((current) => ({ ...current, error: "A recent change could not be saved locally." }));
      });
    }, 180);
    return () => window.clearTimeout(id);
  }, [state.data]);

  useEffect(() => {
    if (!state.data?.activeSession || state.data.activeSession.runningSince === null) return;
    const checkpoint = () => {
      const current = dataRef.current;
      if (current) void saveNestData(current).catch(() => {
        setState((value) => ({ ...value, error: "The active session could not be checkpointed." }));
      });
    };
    const id = window.setInterval(checkpoint, 15_000);
    window.addEventListener("pagehide", checkpoint);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pagehide", checkpoint);
    };
  }, [state.data?.activeSession?.runningSince]);

  const update = useCallback((recipe: (current: NestData) => NestData) => {
    setState((current) => current.data ? { data: recipe(current.data), error: current.error } : current);
  }, []);

  return { data: state.data, error: state.error, update };
}
