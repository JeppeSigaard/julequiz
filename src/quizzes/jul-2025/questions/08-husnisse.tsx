import { FunctionComponent, useEffect, useState } from "react";
import { type QuestionSpec } from "../../../types";

const Answer: FunctionComponent = () => {
  const [a1, setA1] = useState(false);
  const [a2, setA2] = useState(false);
  useEffect(() => {
    setTimeout(() => setA1(true), 2000);
    setTimeout(() => setA2(true), 4000);
  }, []);

  return (
    <>
      <p className="font-display text-[96px] text-accent-deep">Gerda</p>
      {a1 && <p className="text-[58px] font-black text-ink">Og hun er lige bag jer!</p>}
      {a2 && <p className="text-[43px] text-ink-soft">jk</p>}
    </>
  );
};

const question: QuestionSpec = {
  type: "custom",
  body: <p className="text-[58px] font-bold text-ink">Hvad hedder husnissen på Halfdansvej?</p>,
  answer: <Answer />,
};

export default question;
