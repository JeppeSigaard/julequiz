import { type Question } from "../types";
import { asset } from "../asset";
export const Question4: Question = {
  id: "4",
  body: (
    <div className="mb-4 mx-auto w-220 grid gap-4 text-center">
      <img src={asset("/images/ukraine.webp")} className="w-100 mx-auto" />
      <p className="text-5xl">Hvad pynter ukrainere juletræ med?</p>
      <p className="text-4xl">(også i fredstid)</p>
    </div>
  ),
  answer: <img src={asset("/images/spider.png")} className="mx-auto w-250" />,
};
