import { useState } from "react";
import { type Question } from "../types";
import classNames from "classnames";

const Body = () => {
  const [ended, setEnded] = useState(false);
  return (
    <>
      <video
        src="/video/nothing-short.mp4"
        className="w-250"
        autoPlay
        onEnded={() => setEnded(true)}
      />
      <p
        className={classNames(
          "block text-7xl whitespace-nowrap transition-opacity",
          ended ? "opacity-100" : "opacity-0"
        )}
      >
        Hvad er der i pakken?
      </p>
    </>
  );
};

const Answer = () => {
  const [ended, setEnded] = useState(false);
  return (
    <>
      <video
        src="/video/nothing.mp4"
        className="w-250"
        autoPlay
        onEnded={() => setEnded(true)}
      />
      <p
        className={classNames(
          "font-bold block text-7xl whitespace-nowrap transition-opacity",
          ended ? "opacity-100" : "opacity-0"
        )}
      >
        Ingenting (en kat)
      </p>
    </>
  );
};

export const Question17: Question = {
  id: "17",
  body: <Body />,
  answer: <Answer />,
  setVolume: 0.3,
};
