import { useCallback, useEffect, useRef, useState } from "react";
import { AmbientEngine } from "../audio/AmbientEngine";
import { mixForEnvironment } from "../audio/ambientState";
import type { AmbientMix, EnvironmentId } from "../domain/types";

export function useAmbientEngine(environmentId: EnvironmentId, mix: AmbientMix) {
  const engineRef = useRef<AmbientEngine | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "playing" | "error">("idle");

  const start = useCallback(async () => {
    if (state === "starting" || state === "playing") return;
    setState("starting");
    const engine = engineRef.current ?? new AmbientEngine();
    engineRef.current = engine;
    try {
      await engine.start();
      engine.setMix(mixForEnvironment(mix, environmentId));
      setState("playing");
    } catch {
      setState("error");
    }
  }, [environmentId, mix, state]);

  useEffect(() => {
    if (state === "playing") engineRef.current?.setMix(mixForEnvironment(mix, environmentId));
  }, [environmentId, mix, state]);

  useEffect(() => () => { void engineRef.current?.stop(); }, []);

  return { state, start };
}
