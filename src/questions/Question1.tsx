import { type Question } from "../types";
import { asset } from "../asset";
export const Question1: Question = {
  id: "1",
  body: (
    <>
      <h2 className="text-6xl font-extrabold mb-10">
        Hvad hedder denne hollandske figur?
      </h2>
      <img src={asset("/images/dutchchristmas.jpeg")} className="block max-w-200" />
    </>
  ),
  answer: (
    <>
      <h2 className="text-6xl font-extrabold mb-10">Zwarte Piet</h2>
      <img src={asset("/images/dutch1.jpg")} className="block max-w-200" />
    </>
  ),
};
