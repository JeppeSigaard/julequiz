import type { FC } from "react";
import { KeyCap } from "../decor";

export const Footer: FC<{
  opened: number;
  total: number;
  media: { done: number; total: number };
  onOpenSettings: () => void;
}> = ({ opened, total, media, onOpenSettings }) => (
  <footer className="flex flex-none items-center justify-between text-[18px] font-bold text-mist">
    <div className="flex items-center gap-[16px]">
      <span>
        {opened} af {total} låger åbnet
      </span>
      <div className="h-[10px] w-[264px] overflow-hidden rounded-full bg-snow/10">
        <div
          className="h-full rounded-full bg-[repeating-linear-gradient(90deg,var(--quiz-accent)_0_12px,var(--quiz-paper)_12px_24px)]"
          style={{ width: `${total === 0 ? 0 : (opened / total) * 100}%` }}
        />
      </div>
    </div>
    {media.total > 0 && (
      <span>
        {media.done < media.total ? `Henter medier ${media.done} af ${media.total}` : "Medier klar"}
      </span>
    )}
    <button
      type="button"
      // Fokus fjernes, så mellemrum/Enter senere ikke genåbner menuen via knappen
      onClick={(event) => {
        event.currentTarget.blur();
        onOpenSettings();
      }}
      className="flex cursor-pointer items-center gap-[12px]"
    >
      <KeyCap tone="on-dark">M</KeyCap>
      <span>indstillinger</span>
    </button>
  </footer>
);
