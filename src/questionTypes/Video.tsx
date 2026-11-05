import { useState } from "react";
import classNames from "classnames";
import { asset } from "../asset";
import { mediaFrame } from "./Standard";

export const VideoBody = ({
  video,
  prompt,
  caption,
}: {
  video: string;
  prompt: string;
  caption?: string;
}) => {
  const [ended, setEnded] = useState(false);
  const videoHeight = caption !== undefined ? "h-[420px]" : "h-[480px]";
  const promptSize = prompt.length <= 30 ? "text-[77px]" : "text-[58px]";

  return (
    <>
      <div className="relative flex items-center justify-center p-4">
        <video
          autoPlay
          controls={false}
          src={asset(video)}
          className={classNames(
            videoHeight,
            "max-w-[1000px] transition-opacity",
            mediaFrame,
            ended && "opacity-25"
          )}
          onEnded={() => setEnded(true)}
        />
        {/* Prompten vises først når klippet er slut; den kommer aldrig frem, hvis svaret vises før. */}
        <p
          className={classNames(
            "absolute inset-x-0 top-1/2 -translate-y-1/2 px-10 text-center font-display font-bold leading-tight text-ink transition-opacity",
            promptSize,
            ended ? "opacity-100" : "opacity-0"
          )}
        >
          {prompt}
        </p>
      </div>
      {caption !== undefined && <p className="max-w-300 text-center text-[41px] text-ink-soft">{caption}</p>}
    </>
  );
};
