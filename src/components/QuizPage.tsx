"use client";

import { FunctionComponent, useEffect, useState } from "react";
import { QUIZZES } from "../quizzes";
import { QuizBoard } from "./QuizBoard";
import { PackList } from "./PackList";

export const QuizPage: FunctionComponent<{ name: string }> = ({ name }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Et prerenderet bræt ville vise lågerne i filrækkefølge i skala 1, før blanding, gemt tilstand og skalering slår igennem.
  if (!mounted) return <div className="bg-night h-screen" />;

  const quiz = QUIZZES.get(name);
  if (!quiz) return <PackList name={name} />;

  return <QuizBoard quiz={quiz} />;
};
