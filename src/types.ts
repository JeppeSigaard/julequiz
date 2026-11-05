import { ReactNode } from "react";

export type Question = {
  id: string;
  body: ReactNode;
  answer: ReactNode;
  setVolume?: number;
  skip?: boolean;
};
