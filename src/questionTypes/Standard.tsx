import { asset } from "../asset";
import { type Slide } from "../types";

export const textSize = (text: string) =>
  text.length <= 30 ? "text-8xl" : text.length <= 80 ? "text-5xl" : "text-4xl";

export const SlideView = ({ slide }: { slide: Slide }) => (
  <div className="grid gap-4 justify-items-center text-center">
    {slide.video !== undefined && (
      <video src={asset(slide.video)} autoPlay className="mx-auto w-250" />
    )}
    {slide.image !== undefined && (
      <img src={asset(slide.image)} className="mx-auto max-h-[60vh] max-w-250" />
    )}
    {slide.audio !== undefined && <audio src={asset(slide.audio)} autoPlay />}
    {slide.text !== undefined && (
      <p className={`${textSize(slide.text)} max-w-250 font-extrabold`}>{slide.text}</p>
    )}
    {slide.note !== undefined && <p className="text-3xl w-250 max-w-full">{slide.note}</p>}
  </div>
);
