import { useEffect, useMemo, useState } from "react";

const QUOTES = [
  "Stay with the page a little longer.",
  "Small rooms can hold very large dreams.",
  "Quiet work still moves your life forward.",
  "Make a little room for what matters.",
  "You do not have to hurry to go deep.",
  "Some progress is almost silent.",
  "A calm hour can change the shape of a day.",
  "Keep the light on for the work you care about.",
  "One honest hour is enough to begin.",
  "There is beauty in staying with one thing.",
  "Let the world be noisy somewhere else.",
  "Begin softly. Continue carefully.",
] as const;

function quoteForToday() {
  const today = new Date();
  const daySeed = Math.floor(new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 86_400_000);
  return daySeed % QUOTES.length;
}

export default function QuoteWhisper() {
  const initialIndex = useMemo(quoteForToday, []);
  const [index, setIndex] = useState(initialIndex);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % QUOTES.length);
        setVisible(true);
      }, 700);
    }, 5 * 60_000);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={`quote-whisper ${visible ? "is-visible" : ""}`} aria-live="polite">
      <span aria-hidden="true">✦</span>
      <em>{QUOTES[index]}</em>
    </div>
  );
}
