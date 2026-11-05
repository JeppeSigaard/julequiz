import { useState } from "react";
import { type Question } from "../types";

const Answer = () => {
  const [reveal, setReveal] = useState(false);

  return reveal ? (
    <img src="/images/poster-2.jpg" alt="Film" className="w-125" />
  ) : (
    <button onClick={() => setReveal(true)} className="cursor-pointer">
      <img src="/images/poster-2-crop.jpg" alt="Film" className="w-150" />
    </button>
  );
};

export const Question22: Question = {
  id: "22",
  body: <p className="text-7xl">Gæt en julefilm</p>,
  answer: <Answer />,
};
