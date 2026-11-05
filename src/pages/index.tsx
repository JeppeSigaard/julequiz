"use client";

import { FunctionComponent, useEffect, useRef, useState } from "react";
import { POINTS_PER_QUESTION, TEAM_NAMES } from "../config";
import { QUESTIONS } from "../questions";
import Snowfall from "react-snowfall";
import { Fireworks } from "@fireworks-js/react";
import { QuestionCard } from "../components/QuestionCard";
import { QuestionScreen } from "../components/QuestionScreen";
import { AnimatedNumber } from "../components/AnimatedNumber";

import useSound from "use-sound";

import bgmusic from "../audio/waiting-music-116216.mp3";
import lightningRoundMusic from "../audio/lightning-round.mp3";
import dingSFX from "../sfx/ding.mp3";
import classNames from "classnames";
import { Question } from "../types";

// Fisher-Yates shuffle algorithm to randomize questions
function shuffleQuestions<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

const HomePage: FunctionComponent = () => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [questions, setQuestions] = useState<Question[]>(QUESTIONS);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(
    null
  );
  const [team1Cards, setTeam1Cards] = useState<number[]>([]);
  const [team2Cards, setTeam2Cards] = useState<number[]>([]);
  const [noTeamCards, setNoTeamCards] = useState<number[]>([]);
  const [team1ConsolationPoints, setTeam1ConsolationPoints] = useState(0);
  const [team2ConsolationPoints, setTeam2ConsolationPoints] = useState(0);
  const [started, setStarted] = useState(false);
  const [ding] = useSound(dingSFX);
  const [playBgMusic, { stop: stopBgMusic, sound: bgsound }] = useSound(
    bgmusic,
    {
      loop: true,
    }
  );
  const [playLightingRoundMusic, { stop: stopLightningRoundMusic }] = useSound(
    lightningRoundMusic,
    {
      loop: true,
    }
  );

  const pickQuestion = (index: number, question: Question) => () => {
    setActiveQuestionIndex(index);
    if (question.setVolume && bgsound) {
      console.log(bgsound);
      bgsound.volume(question.setVolume);
    }
  };

  const startQuiz = () => {
    setStarted(true);
    stopLightningRoundMusic();
    playBgMusic();
  };

  const stopQuiz = () => {
    clearTimeout(timerRef.current!);
    stopBgMusic();
    setStarted(false);
  };

  const handleAnswer = (team?: number) => {
    if (activeQuestionIndex === null) return;

    if (team === 1) {
      setTeam1Cards([...new Set([...team1Cards, activeQuestionIndex])]);
    } else if (team === 2) {
      setTeam2Cards([...new Set([...team2Cards, activeQuestionIndex])]);
    } else {
      setNoTeamCards([...new Set([...noTeamCards, activeQuestionIndex])]);
    }

    setActiveQuestionIndex(null);
    if (bgsound) {
      bgsound.volume(1);
    }
  };

  const allAnswered = [...team1Cards, ...team2Cards, ...noTeamCards];
  const isFinished = allAnswered.length === 24;
  const activeQuestion =
    activeQuestionIndex !== null ? questions[activeQuestionIndex] : undefined;

  useEffect(() => {
    if (isFinished) {
      stopBgMusic();
      playLightingRoundMusic();
    }
  }, [isFinished]);

  const timer = useRef<NodeJS.Timeout | null>(null);
  const [tick, setTick] = useState(false);
  const tickQuestions = [
    [1, 3, 5, 8, 10, 12, 13, 15, 17, 20, 22, 24],
    [2, 4, 6, 7, 9, 11, 14, 16, 18, 19, 21, 23],
  ];
  useEffect(() => {
    timer.current = setInterval(() => {
      setTick((current) => !current);
    }, 1000);
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [started]);

  useEffect(() => {
    setQuestions(shuffleQuestions(QUESTIONS));
  }, []);

  return (
    <>
      {started && <Snowfall />}
      {isFinished && <Fireworks autostart className="absolute inset-0" />}
      <div className="p-6 bg-green-950 h-screen overflow-hidden flex items-center justify-center">
        <div className="aspect-video bg-green-700 w-full rounded-lg p-6">
          <header className="text-center relative flex justify-center mb-12">
            <h1>
              <button
                className="relative z-40 cursor-pointer text-center font-['Mountains_of_Christmas',Serif] text-white text-7xl font-bold py-6 px-10 rounded-2xl bg-green-800/60 hover:bg-green-800 transition-colors inline-block"
                onClick={() => {
                  if (started) {
                    stopQuiz();
                    return;
                  }
                  startQuiz();
                }}
              >
                den store julequiz
              </button>
            </h1>
            <dl
              className={classNames(
                "absolute transition-all duration-3000 flex justify-between z-20",
                isFinished
                  ? "scale-200 left-[30%] right-[30%] top-100 text-shadow-2xl"
                  : "left-0 right-0 top-6 text-shadow-none"
              )}
            >
              <button
                className="text-left text-white"
                onClick={() => {
                  ding();
                  setTeam1ConsolationPoints((current) => current + 5);
                }}
              >
                <dt className="uppercase font-extrabold text-4xl">
                  {TEAM_NAMES[0]}
                </dt>
                <dd className="font-bold text-3xl">
                  <AnimatedNumber
                    value={
                      team1Cards.length * POINTS_PER_QUESTION +
                      team1ConsolationPoints
                    }
                  />{" "}
                  point
                </dd>
              </button>
              <button
                className="text-right text-white"
                onClick={() => {
                  ding();
                  setTeam2ConsolationPoints((current) => current + 5);
                }}
              >
                <dt className="uppercase font-extrabold text-4xl">
                  {TEAM_NAMES[1]}
                </dt>
                <dd className="font-bold text-3xl">
                  <AnimatedNumber
                    value={
                      team2Cards.length * POINTS_PER_QUESTION +
                      team2ConsolationPoints
                    }
                  />{" "}
                  point
                </dd>
              </button>
            </dl>
          </header>
          <main
            className={classNames(
              "grid grid-cols-6 gap-4",
              isFinished ? "opacity-25" : ""
            )}
          >
            {questions.map((question, index) => (
              <QuestionCard
                number={index + 1}
                contrast={
                  !!tickQuestions[tick ? 1 : 0]?.includes(index + 1) &&
                  started &&
                  !isFinished &&
                  activeQuestionIndex === null &&
                  !question.skip
                }
                key={question.id}
                question={{ ...question, id: String(index + 1) }}
                onClick={pickQuestion(index, question)}
                active={!allAnswered.includes(index) && !question.skip}
              />
            ))}
          </main>
        </div>
      </div>
      {activeQuestion && (
        <QuestionScreen
          question={activeQuestion}
          questionIndex={activeQuestionIndex!}
          onClose={() => {
            setActiveQuestionIndex(null);
            bgsound?.volume(1);
          }}
          onAnswer={handleAnswer}
        />
      )}
    </>
  );
};

export default HomePage;
