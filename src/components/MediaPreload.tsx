import { FunctionComponent } from "react";

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)$/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac)$/i;

// Skjulte elementer henter svarets medier i baggrunden og fylder browserens HTTP-cache, så svarets
// egne elementer starter fra cachen. De skal blive monteret, mens svaret vises: afmonteres de,
// afbrydes downloadet, og de bufferede data går tabt.
export const MediaPreload: FunctionComponent<{ urls: string[] }> = ({ urls }) => {
  if (urls.length === 0) return null;
  return (
    <div hidden aria-hidden="true">
      {[...new Set(urls)].map((url) => {
        // Endelsen testes uden query og fragment (fx "#t=00:00:50"), men hele URL'en hentes.
        const path = url.split(/[?#]/)[0] ?? url;
        return VIDEO_EXT.test(path) ? (
          <video key={url} src={url} preload="auto" muted />
        ) : AUDIO_EXT.test(path) ? (
          <audio key={url} src={url} preload="auto" />
        ) : (
          <img key={url} src={url} alt="" />
        );
      })}
    </div>
  );
};
