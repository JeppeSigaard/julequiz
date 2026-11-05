import useSound from "use-sound";
import { WordPuzzle } from "../components/WordPuzzle";
import dingSFX from "../sfx/ding.mp3";
import wrongSFX from "../sfx/wrong2.mp3";

export const WordPuzzleBody = ({ hint, word }: { hint: string; word: string }) => {
  const [playDingSFX] = useSound(dingSFX);
  const [playWrongSFX] = useSound(wrongSFX);
  return (
    <>
      <p className="mb-10 text-[41px] text-ink-soft">{hint}</p>
      <WordPuzzle
        word={word}
        onCorrectGuess={() => playDingSFX()}
        onIncorrectGuess={() => playWrongSFX()}
        className="text-7xl text-ink"
      />
    </>
  );
};

const answerSize = (word: string) => (word.length <= 12 ? "text-[156px]" : "text-[110px]");

export const WordPuzzleAnswer = ({ word }: { word: string }) => (
  <p className={`${answerSize(word)} font-display font-bold leading-[0.9] text-accent-deep`}>
    {word}
  </p>
);
