import { FunctionComponent } from "react";
import useSound from "use-sound";
import { WordPuzzle } from "../components/WordPuzzle";
import { type Question } from "../types";
import dingSFX from "../sfx/ding.mp3";
import wrongSFX from "../sfx/wrong2.mp3";

const Body: FunctionComponent = () => {
  const [playDingSFX] = useSound(dingSFX);
  const [playWrongSFX] = useSound(wrongSFX);
  return (
    <>
      <p className="text-4xl mb-10">Mums!</p>
      <WordPuzzle
        word="BRÆNDTE MANDLER"
        onCorrectGuess={() => playDingSFX()}
        onIncorrectGuess={() => playWrongSFX()}
        className="text-7xl text-green-900"
      />
    </>
  );
};

export const Question20: Question = {
  id: "20",
  body: <Body />,
  answer: <p className="font-bold text-9xl">BRÆNDTE MANDLER</p>,
};
