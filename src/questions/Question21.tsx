import { MusicBox } from "../components/MusicBox";
import { type Question } from "../types";

import vinylStop from "../sfx/vinyl-stop.mp3";

const Body = () => {
  return (
    <>
      <p className="text-7xl">MUSIKQUIZ!</p>
      <audio src={vinylStop} autoPlay />
    </>
  );
};

export const Question21: Question = {
  id: "21",
  setVolume: 0.05,
  body: <Body />,
  answer: <MusicBox index={1} />,
};
