import { useState } from "react";
import { type Question } from "../types";

const Answer = () => {
  const [reveal, setReveal] = useState(false);

  return reveal ? (
    <img src="/images/poster-3.jpeg" alt="Film" className="w-125" />
  ) : (
    <button onClick={() => setReveal(true)} className="cursor-pointer">
      <img src="/images/poster-3-crop.jpeg" alt="Film" className="w-150" />
    </button>
  );
};

export const Question24: Question = {
  id: "24",
  body: <p className="text-7xl">Gæt en julefilm</p>,
  answer: <Answer />,
};
