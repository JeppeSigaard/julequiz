import { useEffect, useRef, useState } from "react";
import { type Question } from "../types";
import { asset } from "../asset";
import classNames from "classnames";

const Body = () => {
  const [done, setDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <>
      <p className="text-4xl">Hjemmevideo</p>
      <video
        ref={videoRef}
        src={asset("/video/trille.mov")}
        autoPlay
        className={classNames("w-90 relative", done && "opacity-25")}
        onEnded={() => setDone(true)}
      />
      <p
        className={classNames(
          "absolute font-bold z-10 top-1/2 left-1/2 text-6xl -translate-y-1/2 block whitespace-nowrap -translate-x-1/2 transition-opacity",
          done ? "opacity-100" : "opacity-0"
        )}
      >
        Hvad synger trille?
      </p>
    </>
  );
};

const Answer = () => {};

export const Question15: Question = {
  id: "15",
  setVolume: 0.1,
  body: <Body />,
  answer: (
    <>
      <div className="text-7xl font-bold">Valdes Jul</div>
      <div className="text-4xl">Christopher</div>
      <audio src={asset("/audio/Valdes Jul.mp3#t=00:00:50")} autoPlay />
    </>
  ),
};
