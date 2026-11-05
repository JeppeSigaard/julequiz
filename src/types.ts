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
    | { type: "wordPuzzle"; hint: string; word: string }
    | { type: "music"; track: string; song: string; artist: string; start: number; stop: number; answerStart: number }
    | { type: "posterReveal"; prompt: string; cropped: string; full: string }
    | { type: "video"; video: string; prompt: string; caption?: string; answer: Slide }
    | { type: "custom"; body: ReactNode; answer: ReactNode }
  );

export type Quiz = {
  title: string;
  teamNames: [string, string];
  doorWord: string;
  shuffle: boolean;
  pointsPerQuestion: number;
  music: { background: string; finale: string };
};
