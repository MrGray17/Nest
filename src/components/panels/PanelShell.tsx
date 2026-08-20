import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export default function PanelShell({ eyebrow, title, onClose, children }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const returnTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => {
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, []);

  return (
    <aside className="room-panel" role="dialog" aria-modal="false" aria-labelledby={titleId}>
      <header className="panel-header">
        <div><span>{eyebrow}</span><h2 id={titleId}>{title}</h2></div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label={`Close ${title}`}><X size={18} /></button>
      </header>
      <div className="panel-body">{children}</div>
    </aside>
  );
}
