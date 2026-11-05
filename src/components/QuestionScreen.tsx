"use client";

import { FunctionComponent, useEffect, useState } from "react";
import { type Question } from "../types";
import * as motion from "motion/react-client";
import useSound from "use-sound";

import answerSFX from "../sfx/efek.mp3";
import wrongSFX from "../sfx/wrong2.mp3";
import swooshSFX from "../sfx/swoosh2.mp3";

export const QuestionScreen: FunctionComponent<{
  question: Question;
  questionIndex: number;
  doorWord: string;
  teamNames: [string, string];
  onClose: () => void;
  onAnswer: (team?: number) => void;
}> = (props) => {
  const [hasAnswered, setHasAnswered] = useState(false);
  const [playAnswerSFX] = useSound(answerSFX);
  const [playWrongSFX] = useSound(wrongSFX);
  const [playSwooshSFX] = useSound(swooshSFX);

  const onRevealAnswer = () => {
    playSwooshSFX();
    setHasAnswered(true);
  };

  const onAnswer = (team?: number) => () => {
    if (team) {
      playAnswerSFX();
    } else {
      playWrongSFX();
    }
    setHasAnswered(true);
    props.onAnswer(team);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.key === "Enter" || event.key === " ") {
      setHasAnswered(true);
    }

    if (event.key === "Escape" && hasAnswered) {
      return setHasAnswered(false);
    }

    if (event.key === "Escape") {
      props.onClose();
    }

    if (event.key === "1" && hasAnswered) {
      onAnswer(1)();
    }

    if (event.key === "2" && hasAnswered) {
      onAnswer(2)();
    }

    if ((event.key === "q" || event.key === "x") && hasAnswered) {
      onAnswer()();
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasAnswered]);

  return (
    <motion.div
      className="fixed p-20 top-0 left-0 right-0 bottom-0 flex items-center justify-center z-40"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        duration: 0.4,
        scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
      }}
    >
      <div className="aspect-video bg-green-200 w-full rounded-2xl p-10 shadow-2xl relative flex flex-col">
        <header className="relative">
          <hgroup className="text-center">
            <h2 className="text-6xl font-bold font-['Mountains_of_Christmas',Serif] mb-6">
              {props.doorWord} {props.questionIndex + 1}
            </h2>
          </hgroup>
          {!hasAnswered && (
            <button
              className="font-bold cursor-pointer text-lg absolute top-0 left-0"
              onClick={() => onRevealAnswer()}
            >
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
          )}
          <button
            className="cursor-pointer absolute top-0 right-0 text-xl"
            onClick={() => props.onClose()}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        <main className="flex flex-col items-center justify-center grow pb-32 gap-2">
          {hasAnswered ? props.question.answer : props.question.body}
        </main>
        <footer className="absolute bottom-0 left-0 right-0 px-10 py-5">
          {!!hasAnswered && (
            <nav className="flex justify-between">
              <>
                <button
                  className="font-bold cursor-pointer text-lg"
                  onClick={onAnswer(1)}
                >
                  {props.teamNames[0]}
                </button>
                <button
                  className="font-bold cursor-pointer text-lg"
                  onClick={onAnswer()}
                >
                  (ingen)
                </button>
                <button
                  className="font-bold cursor-pointer text-lg"
                  onClick={onAnswer(2)}
                >
                  {props.teamNames[1]}
                </button>
              </>
            </nav>
          )}
        </footer>
      </div>
    </motion.div>
  );
};
