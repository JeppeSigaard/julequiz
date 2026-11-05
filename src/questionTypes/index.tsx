import { type Question, type QuestionSpec } from "../types";
import { SlideView } from "./Standard";

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
    case "custom":
      return { id, body: spec.body, answer: spec.answer, ...common };
  }
};
