"use client";

import { FunctionComponent, useEffect, useRef, useState } from "react";
import { DEFAULT_QUIZ } from "../config";
import { QUIZZES, type LoadedQuiz } from "../quizzes";
import { asset } from "../asset";
import Snowfall from "react-snowfall";
import { QuestionCard } from "../components/QuestionCard";
import { QuestionScreen } from "../components/QuestionScreen";
import { Garland } from "../components/board/Garland";
import { BoardHeader } from "../components/board/BoardHeader";
import { Footer } from "../components/board/Footer";
import { Stage } from "../components/Stage";
import { EndScreen } from "../components/EndScreen";
import { SettingsMenu } from "../components/SettingsMenu";
import { ResetQuizSetting } from "../components/ResetQuizSetting";
import { loadQuizState, saveQuizState } from "../quizState";

import useSound from "use-sound";

import dingSFX from "../sfx/ding.mp3";
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

function gridColumns(count: number): number {
  return Math.max(1, Math.round(Math.sqrt(count * 1.5)));
}

function tickGroup(index: number, columns: number): 0 | 1 {
  return (Math.floor(index / columns) + (index % columns)) % 2 === 0 ? 0 : 1;
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
  const doorCount = questions.filter((q) => !q.skip).length;
  const isFinished =
    questions.some((q) => !q.skip) &&
    questions.every((q, i) => q.skip || allAnswered.includes(i));
  const team1Points =
    team1Cards.length * quiz.pointsPerQuestion + team1ConsolationPoints;
  const team2Points =
    team2Cards.length * quiz.pointsPerQuestion + team2ConsolationPoints;
  const handleConsolation = (team: 1 | 2) => {
    ding();
    if (team === 1) setTeam1ConsolationPoints((current) => current + 5);
    else setTeam2ConsolationPoints((current) => current + 5);
  };
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
    <>
      <Stage colors={quiz.colors}>
        {started && (
          <Snowfall
            color="white"
            radius={[1, 2.5]}
            opacity={[0.15, 0.5]}
            snowflakeCount={60}
          />
        )}
        {isFinished ? (
          <EndScreen
            teamNames={quiz.teamNames}
            points={[team1Points, team2Points]}
            doors={[team1Cards.length, team2Cards.length]}
            consolation={[team1ConsolationPoints, team2ConsolationPoints]}
            onConsolation={handleConsolation}
          />
        ) : (
          <>
            <Garland />
            <div className="absolute inset-0 flex flex-col gap-[22px] px-[58px] pt-[84px] pb-[26px]">
              <BoardHeader
                title={quiz.title}
                doorCount={doorCount}
                teamNames={quiz.teamNames}
                points={[team1Points, team2Points]}
                doors={[team1Cards.length, team2Cards.length]}
                consolation={[team1ConsolationPoints, team2ConsolationPoints]}
                onConsolation={handleConsolation}
                onTitleClick={() => {
                  if (started) {
                    stopQuiz();
                    return;
                  }
                  startQuiz();
                }}
              />
              <main className="relative flex-1 min-h-0 rounded-[31px] bg-night/50 p-[26px] shadow-[inset_0_2px_22px_rgb(0_0_0/0.45)]">
                <div
                  aria-hidden="true"
                  className="absolute inset-[10px] rounded-[24px] border-2 border-dashed border-highlight/20"
                />
                <div
                  className="relative grid h-full gap-[22px]"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${Math.ceil(
                      questions.length / columns
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {questions.map((question, index) => {
                    const status = team1Cards.includes(index)
                      ? "team-1"
                      : team2Cards.includes(index)
                      ? "team-2"
                      : noTeamCards.includes(index)
                      ? "nobody"
                      : question.skip
                      ? "skip"
                      : "closed";
                    const teamName =
                      status === "team-1"
                        ? quiz.teamNames[0]
                        : status === "team-2"
                        ? quiz.teamNames[1]
                        : undefined;
                    return (
                      <QuestionCard
                        key={question.id}
                        number={index + 1}
                        doorWord={quiz.doorWord}
                        status={status}
                        {...(teamName !== undefined ? { teamName } : {})}
                        glow={
                          tickGroup(index, columns) === (tick ? 1 : 0) &&
                          started &&
                          activeQuestionIndex === null &&
                          !question.skip
                        }
                        onClick={pickQuestion(index, question)}
                      />
                    );
                  })}
                </div>
              </main>
              <Footer
                opened={allAnswered.length}
                total={doorCount}
              />
            </div>
          </>
        )}
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
      </Stage>
    </>
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
  if (packName === null) return <div className="bg-night h-screen" />;

  const quiz = QUIZZES.get(packName);
  if (!quiz) {
    return (
      <div className="min-h-screen bg-night text-snow font-body p-10">
        <h1 className="font-display text-highlight text-6xl mb-4">Ukendt quiz: {packName}</h1>
        <p className="mb-2">Vælg en quiz:</p>
        <ul className="list-disc pl-6">
          {[...QUIZZES.keys()].map((name) => (
            <li key={name}>
              <a className="text-highlight underline" href={`?quiz=${name}`}>
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
