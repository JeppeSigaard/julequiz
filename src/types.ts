import { ReactNode } from "react";

export type Question = {
  id: string;
  body: ReactNode;
  answer: ReactNode;
  preload: string[];
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
    | { type: "priceGuess"; image: string; title: string; description: string; price: string }
    | { type: "video"; video: string; prompt: string; caption?: string; answer: Slide }
    | { type: "custom"; body: ReactNode; answer: ReactNode; preload?: string[] }
  );

export type Quiz = {
  title: string;
  teamNames: [string, string];
  doorWord: string;
  shuffle: boolean;
  pointsPerQuestion: number;
  music: { background: string; finale: string };
  colors: {
    background: string;
    paper: string;
    ink: string;
    accent: string;
    highlight: string;
    team1: string;
    team2: string;
  };
};
