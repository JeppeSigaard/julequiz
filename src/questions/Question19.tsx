import { useRef, useState } from "react";
import { type Question } from "../types";
import { asset } from "../asset";

const Body = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);

  return (
    <>
      <video
        ref={videoRef}
        src={asset("/video/letgo.mp4")}
        className="w-275"
        onEnded={() => setEnded(true)}
      />
      {ended ? (
        <p className="text-6xl">Hvor mange personer er der i videoen?</p>
      ) : (
        <button
          className="text-6xl cursor-pointer"
          onClick={() => videoRef.current?.play()}
        >
          Se godt efter
        </button>
      )}
    </>
  );
};

const Answer = () => {
  const [ended, setEnded] = useState(false);
  return (
    <>
      <video
        autoPlay
        src={asset("/video/letgoansw.mp4")}
        className="w-275"
        onEnded={() => setEnded(true)}
      />
      {ended && <p className="text-7xl font-bold">7</p>}
    </>
  );
};

export const Question19: Question = {
  id: "19",
  body: <Body />,
  setVolume: 0.4,
  answer: (
    <>
      <video autoPlay src={asset("/video/letgoansw.mp4")} className="w-275" />,
      <p className="text-7xl font-bold">7</p>
    </>
  ),
};
