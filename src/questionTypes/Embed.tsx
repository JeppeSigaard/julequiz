import { useEffect, useRef } from "react";
import classNames from "classnames";
import { mediaFrame } from "./Standard";

export const EmbedBody = ({ url, text }: { url: string; text?: string }) => {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onChange = () => {
      // Fokus kan blive i iframen og sluge tastetryk, så lågens taster ikke virker.
      if (document.fullscreenElement === null) window.focus();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 p-4 pt-8">
      {text !== undefined && (
        <p className="max-w-300 text-center font-body text-[43px] font-extrabold leading-tight text-ink">
          {text}
        </p>
      )}
      {/* Rammen bærer kanten, så selve iframen er præcis 16:9. */}
      <div className={classNames(mediaFrame, "relative overflow-hidden bg-paper-lit")}>
        <iframe
          ref={ref}
          src={url}
          title="Indlejret side"
          allow="fullscreen; autoplay; screen-wake-lock"
          className={classNames(
            "block aspect-video",
            text !== undefined ? "w-[816px]" : "w-[992px]"
          )}
        />
        <button
          type="button"
          aria-label="Fuldskærm"
          title="Fuldskærm"
          onClick={() => void ref.current?.requestFullscreen()}
          className="absolute top-1/2 left-1/2 flex size-[132px] -translate-1/2 cursor-pointer items-center justify-center rounded-full bg-ink/85 text-snow shadow-pill-dark hover:bg-ink"
        >
          {/* `!`, fordi material-symbols-CSS’en ligger uden for Tailwinds lag og ellers vinder. */}
          <span className="material-symbols-outlined text-[84px]!">fullscreen</span>
        </button>
      </div>
    </div>
  );
};
