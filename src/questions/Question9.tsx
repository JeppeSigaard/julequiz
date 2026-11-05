import { FunctionComponent } from "react";
import useSound from "use-sound";
import { WordPuzzle } from "../components/WordPuzzle";
import { type QuestionSpec } from "../types";
import dingSFX from "../sfx/ding.mp3";
import wrongSFX from "../sfx/wrong2.mp3";

const Body: FunctionComponent = () => {
  const [playDingSFX] = useSound(dingSFX);
  const [playWrongSFX] = useSound(wrongSFX);
  return (
    <>
      <p className="text-4xl mb-10">Av, det stikker!</p>
      <WordPuzzle
        word="PYNTEGRAN"
        onCorrectGuess={() => playDingSFX()}
        onIncorrectGuess={() => playWrongSFX()}
        className="text-7xl text-green-900"
      />
    </>
  );
};

export const Question9: QuestionSpec = {
  type: "custom",
  body: <Body />,
  answer: <p className="font-bold text-9xl">PYNTEGRAN</p>,
};
