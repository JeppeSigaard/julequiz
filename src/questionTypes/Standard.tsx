import { asset } from "../asset";
import { type Slide } from "../types";

export const textSize = (text: string) =>
  text.length <= 30 ? "text-[96px]" : text.length <= 80 ? "text-[58px]" : "text-[43px]";

// Papirramme med kantskygge, delt af alle renderere. p-4 på omgivelserne giver plads til tilt.
export const mediaFrame =
  "rounded-lg border-8 border-paper-lit object-contain shadow-[0_8px_0_var(--color-paper-edge)]";

export const SlideView = ({ slide }: { slide: Slide }) => (
  <div className="grid gap-6 justify-items-center text-center">
    {slide.video !== undefined && (
      // Ingen tilt på video: den afspilles, og en skæv afspilning ser forkert ud.
      <video
        src={asset(slide.video)}
        autoPlay
        className={`mx-auto max-h-[480px] max-w-[1000px] ${mediaFrame}`}
      />
    )}
    {slide.image !== undefined && (
      <div className="p-4">
        <img
          src={asset(slide.image)}
          className={`mx-auto max-h-[480px] max-w-[1000px] -rotate-1 ${mediaFrame}`}
        />
      </div>
    )}
    {slide.audio !== undefined && <audio src={asset(slide.audio)} autoPlay />}
    {slide.text !== undefined && (
      <p className={`${textSize(slide.text)} max-w-300 font-body font-extrabold leading-tight text-ink`}>
        {slide.text}
      </p>
    )}
    {slide.note !== undefined && (
      <p className="max-w-300 text-[41px] leading-snug text-ink-soft">{slide.note}</p>
    )}
  </div>
);
