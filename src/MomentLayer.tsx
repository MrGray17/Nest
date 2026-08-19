import type { PlaceId } from "./PlaceScene";

export type AmbientMoment = "shooting-star" | "cat" | "gull" | "falling-leaf" | "page-flutter" | "firefly-burst" | null;

export default function MomentLayer({ moment, place }: { moment: AmbientMoment; place: PlaceId }) {
  if (!moment) return null;

  return (
    <div className={`ambient-moment moment-${moment} moment-place-${place}`} aria-hidden="true">
      {moment === "shooting-star" && <span />}
      {moment === "cat" && <span>ᓚᘏᗢ</span>}
      {moment === "gull" && <><span>⌁</span><span>⌁</span></>}
      {moment === "falling-leaf" && <><span>❧</span><span>❧</span><span>❧</span></>}
      {moment === "page-flutter" && <span>⌑</span>}
      {moment === "firefly-burst" && <><span /><span /><span /><span /><span /></>}
    </div>
  );
}
