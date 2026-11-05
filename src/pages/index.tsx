"use client";

import { CSSProperties, FunctionComponent, useEffect, useRef, useState } from "react";
import { DEFAULT_QUIZ } from "../config";
import { QUIZZES, type LoadedQuiz } from "../quizzes";
import { asset } from "../asset";
import Snowfall from "react-snowfall";
import { Fireworks } from "@fireworks-js/react";
import { QuestionCard } from "../components/QuestionCard";
import { QuestionScreen } from "../components/QuestionScreen";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { SettingsMenu } from "../components/SettingsMenu";
import { ResetQuizSetting } from "../components/ResetQuizSetting";
import { loadQuizState, saveQuizState } from "../quizState";

import useSound from "use-sound";

import dingSFX from "../sfx/ding.mp3";
import classNames from "classnames";
import { Question, Quiz } from "../types";

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

function gridColumns(count: number): number {
  return Math.max(1, Math.round(Math.sqrt(count * 1.5)));
}

function tickGroup(index: number, columns: number): 0 | 1 {
  return (Math.floor(index / columns) + (index % columns)) % 2 === 0 ? 0 : 1;
}

const TITLE_FONT_FAMILIES: Record<Quiz["titleFont"], string> = {
  "Mountains of Christmas": "'Mountains of Christmas', serif",
  Nunito: "'Nunito', sans-serif",
  "DM Sans": "'DM Sans', sans-serif",
};

// Variablerne læses af bg-(--color-…)-klasserne i flere komponenter.
function themeStyle(quiz: Quiz): CSSProperties {
  return {
    "--color-page": quiz.colors.page,
    "--color-board": quiz.colors.board,
    "--color-door": quiz.colors.door,
    "--color-doorHighlight": quiz.colors.doorHighlight,
    "--color-doorDone": quiz.colors.doorDone,
    "--color-screen": quiz.colors.screen,
    "--color-text": quiz.colors.text,
    "--font-title": TITLE_FONT_FAMILIES[quiz.titleFont],
  } as CSSProperties;
}

const QuizBoard: FunctionComponent<{ quiz: LoadedQuiz }> = ({ quiz }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [questions, setQuestions] = useState<Question[]>(quiz.questions);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(
    null
  );
  const [team1Cards, setTeam1Cards] = useState<number[]>([]);
  const [team2Cards, setTeam2Cards] = useState<number[]>([]);
  const [noTeamCards, setNoTeamCards] = useState<number[]>([]);
  const [team1ConsolationPoints, setTeam1ConsolationPoints] = useState(0);
  const [team2ConsolationPoints, setTeam2ConsolationPoints] = useState(0);
  const [started, setStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ding] = useSound(dingSFX);
  const [playBgMusic, { stop: stopBgMusic, sound: bgsound }] = useSound(
    asset(quiz.music.background),
    {
      loop: true,
    }
  );
  const [playLightingRoundMusic, { stop: stopLightningRoundMusic }] = useSound(
    asset(quiz.music.finale),
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
  const columns = gridColumns(questions.length);
  const isFinished =
    questions.some((q) => !q.skip) &&
    questions.every((q, i) => q.skip || allAnswered.includes(i));
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
    const saved = loadQuizState(quiz.name, quiz.questions);
    if (saved) {
      const restored = saved.questionIds.map(
        (id) => quiz.questions.find((q) => q.id === id)!
      );
      setQuestions(restored);
      setTeam1Cards(saved.team1Cards);
      setTeam2Cards(saved.team2Cards);
      setNoTeamCards(saved.noTeamCards);
      setTeam1ConsolationPoints(saved.team1ConsolationPoints);
      setTeam2ConsolationPoints(saved.team2ConsolationPoints);
    } else {
      setQuestions(
        quiz.shuffle ? shuffleQuestions(quiz.questions) : quiz.questions
      );
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Uden denne port skriver første commit standardværdier, og StrictModes
    // anden load-kørsel ville så læse dem i stedet for den gemte quiz.
    if (!isLoaded) return;
    saveQuizState(quiz.name, {
      questionIds: questions.map((q) => q.id),
      team1Cards,
      team2Cards,
      noTeamCards,
      team1ConsolationPoints,
      team2ConsolationPoints,
    });
  }, [
    isLoaded,
    questions,
    team1Cards,
    team2Cards,
    noTeamCards,
    team1ConsolationPoints,
    team2ConsolationPoints,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.repeat) return;
      if (
        (event.key === "m" || event.key === "M") &&
        activeQuestionIndex === null
      ) {
        setSettingsOpen((open) => !open);
      }
      if (event.key === "Escape" && settingsOpen) {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeQuestionIndex, settingsOpen]);

  return (
    <div style={themeStyle(quiz)}>
      {started && quiz.snow && <Snowfall />}
      {isFinished && <Fireworks autostart className="absolute inset-0" />}
      <div className="p-6 bg-(--color-page) h-screen overflow-hidden flex items-center justify-center">
        <div className="aspect-video bg-(--color-board) w-full rounded-lg p-6">
          <header className="text-center relative flex justify-center mb-12">
            <h1>
              <button
                className="relative z-40 cursor-pointer text-center font-(family-name:--font-title) text-white text-7xl font-bold py-6 px-10 rounded-2xl bg-(--color-doorDone)/60 hover:bg-(--color-doorDone) transition-colors inline-block"
                onClick={() => {
                  if (started) {
                    stopQuiz();
                    return;
                  }
                  startQuiz();
                }}
              >
                {quiz.title}
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
                  {quiz.teamNames[0]}
                </dt>
                <dd className="font-bold text-3xl">
                  <AnimatedNumber
                    value={
                      team1Cards.length * quiz.pointsPerQuestion +
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
                  {quiz.teamNames[1]}
                </dt>
                <dd className="font-bold text-3xl">
                  <AnimatedNumber
                    value={
                      team2Cards.length * quiz.pointsPerQuestion +
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
              "grid gap-4",
              isFinished ? "opacity-25" : ""
            )}
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {questions.map((question, index) => (
              <QuestionCard
                number={index + 1}
                contrast={
                  tickGroup(index, columns) === (tick ? 1 : 0) &&
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
          doorWord={quiz.doorWord}
          teamNames={quiz.teamNames}
        />
      )}
      {settingsOpen && (
        <SettingsMenu onClose={() => setSettingsOpen(false)}>
          <ResetQuizSetting pack={quiz.name} />
        </SettingsMenu>
      )}
    </div>
  );
};

const HomePage: FunctionComponent = () => {
  const [packName, setPackName] = useState<string | null>(null);

  useEffect(() => {
    setPackName(
      new URLSearchParams(window.location.search).get("quiz") ?? DEFAULT_QUIZ
    );
  }, []);

  // Siden prerenderes uden URL'en, så før packen er kendt må HTML'en ikke afhænge af den.
  if (packName === null) return <div className="bg-green-950 h-screen" />;

  const quiz = QUIZZES.get(packName);
  if (!quiz) {
    return (
      <div className="min-h-screen bg-white text-black p-10">
        <h1 className="text-4xl font-bold mb-4">Ukendt quiz: {packName}</h1>
        <p className="mb-2">Vælg en quiz:</p>
        <ul className="list-disc pl-6">
          {[...QUIZZES.keys()].map((name) => (
            <li key={name}>
              <a className="text-blue-700 underline" href={`?quiz=${name}`}>
                {name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <QuizBoard key={packName} quiz={quiz} />;
};

export default HomePage;
