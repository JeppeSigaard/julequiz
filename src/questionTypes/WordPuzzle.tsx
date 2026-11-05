import useSound from "use-sound";
import { WordPuzzle } from "../components/WordPuzzle";
import dingSFX from "../sfx/ding.mp3";
import wrongSFX from "../sfx/wrong2.mp3";

export const WordPuzzleBody = ({ hint, word }: { hint: string; word: string }) => {
  const [playDingSFX] = useSound(dingSFX);
  const [playWrongSFX] = useSound(wrongSFX);
  return (
    <>
      <p className="text-4xl mb-10">{hint}</p>
      <WordPuzzle
        word={word}
        onCorrectGuess={() => playDingSFX()}
        onIncorrectGuess={() => playWrongSFX()}
        className="text-7xl text-green-900"
      />
    </>
  );
};

export const WordPuzzleAnswer = ({ word }: { word: string }) => (
  <p className="font-bold text-9xl">{word}</p>
);
