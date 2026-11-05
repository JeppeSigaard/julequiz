import { FunctionComponent, useEffect, useState } from "react";
import { type Question } from "../types";

const Answer: FunctionComponent = () => {
  const [a1, setA1] = useState(false);
  const [a2, setA2] = useState(false);
  useEffect(() => {
    setTimeout(() => setA1(true), 2000);
    setTimeout(() => setA2(true), 4000);
  }, []);

  return (
    <>
      <p className="text-6xl">Gerda</p>
      {a1 && <p className="text-6xl font-extrabold">Og hun er lige bag jer!</p>}
      {a2 && <p className="text-4xl">jk</p>}
    </>
  );
};

export const Question8: Question = {
  id: "8",
  body: <p className="text-6xl">Hvad hedder husnissen på Halfdansvej?</p>,
  answer: <Answer />,
};
