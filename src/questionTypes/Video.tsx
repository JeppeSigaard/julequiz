import { useState } from "react";
import classNames from "classnames";
import { asset } from "../asset";

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

  return (
    <>
      <div className="relative flex justify-center items-center">
        <video
          autoPlay
          controls={false}
          src={asset(video)}
          className={classNames(
            "h-[55vh] max-w-250 object-contain transition-opacity",
            ended && "opacity-25"
          )}
          onEnded={() => setEnded(true)}
        />
        {/* Prompten vises først når klippet er slut; den kommer aldrig frem, hvis svaret vises før. */}
        <p
          className={classNames(
            "absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-5xl font-bold transition-opacity",
            ended ? "opacity-100" : "opacity-0"
          )}
        >
          {prompt}
        </p>
      </div>
      {caption !== undefined && <p className="text-3xl">{caption}</p>}
    </>
  );
};
