import { ENVIRONMENT_MAP } from "../../config/environments";
import type { SessionRecord, YouTubeSource } from "../../domain/types";
import PanelShell from "./PanelShell";

type Props = { history: SessionRecord[]; sources: YouTubeSource[]; onClose: () => void };

export default function HistoryPanel({ history, sources, onClose }: Props) {
  const recentMinutes = history
    .filter((session) => Date.now() - new Date(session.startedAt).getTime() < 7 * 86_400_000)
    .reduce((sum, session) => sum + session.minutes, 0);

  return (
    <PanelShell eyebrow="A quiet record" title="History" onClose={onClose}>
      <div className="history-total"><strong>{Math.floor(recentMinutes / 60)}h {recentMinutes % 60}m</strong><span>last 7 days</span></div>
      {history.length === 0 ? <p className="panel-empty">Your finished sessions will rest here. No streaks, no scores.</p> : (
        <div className="history-list">
          {history.slice(0, 20).map((session) => {
            const source = sources.find((item) => item.id === session.sourceId);
            const environment = ENVIRONMENT_MAP[session.environmentId];
            return (
              <article key={session.id}>
                <div><strong>{session.task}</strong><span>{environment.icon} {environment.shortName}{source ? ` · ${source.name}` : ""}</span>{session.note && <em>“{session.note}”</em>}</div>
                <aside><b>{session.minutes}m</b><small>{new Date(session.startedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</small></aside>
              </article>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}
