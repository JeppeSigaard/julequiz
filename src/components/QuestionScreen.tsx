"use client";

import { FunctionComponent, useEffect, useState } from "react";
import { type Question } from "../types";
import * as motion from "motion/react-client";
import useSound from "use-sound";
import { PillButton } from "./decor";

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
    <>
      {/* Skyggen er søskende til fjeder-wrapperen, så den ikke skalerer op fra 0 sammen med kortet */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-night/80 backdrop-blur-[4px]"
      />
      <motion.div
        className="fixed inset-0 z-40 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.4,
          scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
        }}
      >
        <div
          role="dialog"
          aria-label={`${props.doorWord} ${props.questionIndex + 1}`}
          className="relative flex h-[912px] w-[1656px] flex-col items-center rounded-[36px] bg-paper text-ink px-[84px] pb-[53px] shadow-[0_12px_0_color-mix(in_oklab,var(--quiz-paper)_80%,black),0_48px_96px_rgb(0_0_0/0.6)]"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in oklab, var(--quiz-accent) 6%, transparent) 1.8px, transparent 1.9px)",
            backgroundSize: "26px 26px",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[17px] rounded-[24px] border-[4px] border-dashed border-accent/35"
          />
          <svg
            aria-hidden="true"
            width="144"
            height="108"
            viewBox="0 0 120 90"
            className="absolute left-[31px] top-[26px]"
          >
            <path
              d="M58 48 C 40 20, 18 26, 6 14 C 14 30, 10 40, 22 50 C 30 46, 40 54, 58 48 Z"
              className="fill-ink-soft stroke-ink"
              strokeWidth={2}
            />
            <path
              d="M62 48 C 76 18, 100 22, 114 12 C 106 28, 112 40, 98 50 C 90 46, 80 56, 62 48 Z"
              className="fill-ink stroke-ink"
              strokeWidth={2}
            />
            <circle cx="54" cy="56" r="9" className="fill-accent" />
            <circle cx="68" cy="56" r="9" className="fill-accent" />
            <circle cx="61" cy="68" r="9" className="fill-accent-deep" />
            <circle cx="51" cy="53" r="2.5" className="fill-paper-lit" />
          </svg>
          <button
            type="button"
            aria-label="Luk lågen"
            onClick={() => props.onClose()}
            className="absolute right-[41px] top-[36px] flex size-[62px] cursor-pointer items-center justify-center rounded-full bg-ink/10 text-ink"
          >
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
          <div className="relative -mt-0.5 flex items-start">
            <div
              aria-hidden="true"
              className="mt-[22px] -mr-[17px] h-[77px] w-[55px] bg-accent-deep [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,34%_50%)]"
            />
            <h2 className="relative rounded-b-[22px] bg-accent px-[67px] pt-3 pb-[17px] font-display text-[79px] font-bold leading-none text-paper-lit shadow-[0_7px_0_color-mix(in_oklab,var(--quiz-accent)_72%,black)]">
              {props.doorWord} {props.questionIndex + 1}
            </h2>
            <div
              aria-hidden="true"
              className="mt-[22px] -ml-[17px] h-[77px] w-[55px] bg-accent-deep [clip-path:polygon(0_0,100%_0,66%_50%,100%_100%,0_100%)]"
            />
          </div>
          <main className="flex min-h-0 w-[1200px] grow flex-col items-center justify-center gap-[26px] text-center">
            {hasAnswered ? props.question.answer : props.question.body}
          </main>
          <footer className="flex min-h-[101px] w-full items-center justify-center gap-[29px]">
            {hasAnswered ? (
              <>
                <PillButton
                  variant="team-1"
                  keyHint="1"
                  onClick={onAnswer(1)}
                >
                  {props.teamNames[0]}
                </PillButton>
                <PillButton
                  variant="neutral"
                  keyHint="Q"
                  onClick={onAnswer()}
                >
                  Ingen fik den
                </PillButton>
                <PillButton
                  variant="team-2"
                  keyHint="2"
                  onClick={onAnswer(2)}
                >
                  {props.teamNames[1]}
                </PillButton>
              </>
            ) : (
              <PillButton
                variant="dark"
                keyHint="Enter"
                onClick={() => onRevealAnswer()}
              >
                Vis svaret
              </PillButton>
            )}
          </footer>
        </div>
      </motion.div>
    </>
  );
};
