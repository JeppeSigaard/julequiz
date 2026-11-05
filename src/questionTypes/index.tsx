import { type Question, type QuestionSpec } from "../types";
import { asset } from "../asset";
import { MusicBox } from "../components/MusicBox";
import { MusicBody } from "./Music";
import { PosterAnswer } from "./PosterReveal";
import { SlideView } from "./Standard";
import { VideoBody } from "./Video";
import { WordPuzzleAnswer, WordPuzzleBody } from "./WordPuzzle";

export const toQuestion = (spec: QuestionSpec, id: string): Question => {
  // exactOptionalPropertyTypes: valgfrie felter udelades frem for at sættes til undefined.
  const common = {
    ...(spec.backgroundVolume !== undefined && { setVolume: spec.backgroundVolume }),
    ...(spec.skip !== undefined && { skip: spec.skip }),
  };
  // Ingen default: en ny spørgsmålstype skal give en kompileringsfejl her.
  switch (spec.type) {
    case "standard":
      return {
        id,
        body: <SlideView slide={spec.question} />,
        answer: <SlideView slide={spec.answer} />,
        ...common,
      };
    case "wordPuzzle":
      return {
        id,
        body: <WordPuzzleBody hint={spec.hint} word={spec.word} />,
        answer: <WordPuzzleAnswer word={spec.word} />,
        ...common,
      };
    case "music":
      return {
        id,
        body: <MusicBody />,
        answer: (
          <MusicBox
            track={asset(spec.track)}
            song={spec.song}
            artist={spec.artist}
            start={spec.start}
            stop={spec.stop}
            answerStart={spec.answerStart}
          />
        ),
        ...common,
      };
    case "posterReveal":
      return {
        id,
        body: <p className="text-7xl">{spec.prompt}</p>,
        answer: <PosterAnswer prompt={spec.prompt} cropped={spec.cropped} full={spec.full} />,
        ...common,
      };
    case "video":
      return {
        id,
        body: (
          <VideoBody
            video={spec.video}
            prompt={spec.prompt}
            {...(spec.caption !== undefined && { caption: spec.caption })}
          />
        ),
        answer: <SlideView slide={spec.answer} />,
        ...common,
      };
    case "custom":
      return { id, body: spec.body, answer: spec.answer, ...common };
  }
};
