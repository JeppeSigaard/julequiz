import { useEffect, useRef } from "react";
import classNames from "classnames";
import { PillButton } from "../components/decor";
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
      <iframe
        ref={ref}
        src={url}
        title="Indlejret side"
        allow="fullscreen; autoplay; screen-wake-lock"
        className={classNames(
          mediaFrame,
          "w-[1100px] bg-paper-lit",
          text !== undefined ? "h-[460px]" : "h-[560px]"
        )}
      />
      <PillButton variant="neutral" onClick={() => void ref.current?.requestFullscreen()}>
        Fuldskærm
      </PillButton>
    </div>
  );
};
