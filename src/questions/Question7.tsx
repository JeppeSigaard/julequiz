import { GuessThatCat } from "../components/GuessThatCat";
import { type QuestionSpec } from "../types";
export const Question7: QuestionSpec = {
  type: "custom",
  backgroundVolume: 0.7,
  body: <p className="text-6xl">Hvem er den Gabby-kat?</p>,
  answer: <GuessThatCat from={4000} to={6000} className="w-125 mx-auto" />,
};
