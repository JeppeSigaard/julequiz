import { type Question, type QuestionSpec, type Slide } from "../types";
import { asset } from "../asset";
import { MusicAnswer } from "../components/MusicBox";
import { MusicBody } from "./Music";
import { PosterAnswer, PosterBody } from "./PosterReveal";
import { SlideView } from "./Standard";
import { VideoBody } from "./Video";
import { WordPuzzleAnswer, WordPuzzleBody } from "./WordPuzzle";

const slideMedia = (slide: Slide) =>
  [slide.image, slide.video, slide.audio].filter((p): p is string => p !== undefined);

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
        preload: slideMedia(spec.answer).map(asset),
        ...common,
      };
    case "wordPuzzle":
      return {
        id,
        body: <WordPuzzleBody hint={spec.hint} word={spec.word} />,
        answer: <WordPuzzleAnswer word={spec.word} />,
        preload: [],
        ...common,
      };
    case "music":
      return {
        id,
        body: <MusicBody track={asset(spec.track)} start={spec.start} stop={spec.stop} />,
        answer: (
          <MusicAnswer
            track={asset(spec.track)}
            song={spec.song}
            artist={spec.artist}
            answerStart={spec.answerStart}
          />
        ),
        preload: [asset(spec.track)],
        ...common,
      };
    case "posterReveal":
      return {
        id,
        body: <PosterBody prompt={spec.prompt} cropped={spec.cropped} />,
        answer: <PosterAnswer prompt={spec.prompt} full={spec.full} />,
        preload: [spec.cropped, spec.full].map(asset),
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
        preload: slideMedia(spec.answer).map(asset),
        ...common,
      };
    case "custom":
      return {
        id,
        body: spec.body,
        answer: spec.answer,
        preload: (spec.preload ?? []).map(asset),
        ...common,
      };
  }
};
