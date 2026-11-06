import { type Question, type QuestionSpec, type Slide } from "../types";
import { EmbedBody } from "./Embed";
import { MusicAnswer } from "../components/MusicBox";
import { MusicBody } from "./Music";
import { PosterAnswer, PosterBody } from "./PosterReveal";
import { PriceListing } from "./PriceGuess";
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
        preload: [...slideMedia(spec.question), ...slideMedia(spec.answer)],
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
        body: <MusicBody track={spec.track} start={spec.start} stop={spec.stop} />,
        answer: (
          <MusicAnswer
            track={spec.track}
            song={spec.song}
            artist={spec.artist}
            answerStart={spec.answerStart}
          />
        ),
        preload: [spec.track],
        ...common,
      };
    case "posterReveal":
      return {
        id,
        body: <PosterBody prompt={spec.prompt} cropped={spec.cropped} />,
        answer: <PosterAnswer prompt={spec.prompt} full={spec.full} />,
        preload: [spec.cropped, spec.full],
        ...common,
      };
    case "priceGuess":
      return {
        id,
        body: <PriceListing image={spec.image} title={spec.title} description={spec.description} />,
        answer: (
          <PriceListing
            image={spec.image}
            title={spec.title}
            description={spec.description}
            price={spec.price}
          />
        ),
        preload: [spec.image],
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
        preload: [spec.video, ...slideMedia(spec.answer)],
        ...common,
      };
    case "embed":
      return {
        id,
        body: (
          <EmbedBody
            url={spec.question.url}
            {...(spec.question.text !== undefined && { text: spec.question.text })}
          />
        ),
        answer: <SlideView slide={spec.answer} />,
        preload: slideMedia(spec.answer),
        ...common,
      };
    case "custom":
      return {
        id,
        body: spec.body,
        answer: spec.answer,
        preload: spec.preload ?? [],
        ...common,
      };
  }
};
