import { ReactNode } from "react";

export type Question = {
  id: string;
  body: ReactNode;
  answer: ReactNode;
  setVolume?: number;
  skip?: boolean;
};

export type Slide = { text?: string; note?: string; image?: string; video?: string; audio?: string };

type Common = { backgroundVolume?: number; skip?: boolean };

export type QuestionSpec = Common &
  (
    | { type: "standard"; question: Slide; answer: Slide }
    | { type: "custom"; body: ReactNode; answer: ReactNode }
  );
