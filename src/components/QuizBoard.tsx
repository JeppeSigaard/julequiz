"use client";

import { FunctionComponent, useEffect, useRef, useState } from "react";
import type { LoadedQuiz } from "../quizzes";
import { asset } from "../asset";
import Snowfall from "react-snowfall";
import { QuestionCard } from "./QuestionCard";
import { QuestionScreen } from "./QuestionScreen";
import { Garland } from "./board/Garland";
import { BoardHeader } from "./board/BoardHeader";
import { Footer } from "./board/Footer";
import { Stage } from "./Stage";
import { EndScreen } from "./EndScreen";
import { SettingsMenu } from "./SettingsMenu";
import { PracticeSetting } from "./PracticeSetting";
import { TeamPointsSetting } from "./TeamPointsSetting";
import { ResetQuizSetting } from "./ResetQuizSetting";
import { TeamNamesSetting } from "./TeamNamesSetting";
import {
  loadQuizState,
  loadTeamNames,
  saveQuizState,
  saveTeamNames,
} from "../quizState";
import { useMuffle } from "../muffle";

import useSound from "use-sound";

import dingSFX from "../sfx/ding.mp3";
import wrongSFX from "../sfx/wrong2.mp3";
import answerSFX from "../sfx/efek.mp3";
import swooshSFX from "../sfx/swoosh2.mp3";
import vinylStopSFX from "../sfx/vinyl-stop.mp3";
import yoshiSFX from "../sfx/yoshi-tongue.mp3";
import { preloadMedia } from "../mediaCache";
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

export const QuizBoard: FunctionComponent<{ quiz: LoadedQuiz }> = ({ quiz }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [questions, setQuestions] = useState<Question[]>(quiz.questions);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(
    null
  );
  const [practiceIndex, setPracticeIndex] = useState<number | null>(null);
  const [team1Cards, setTeam1Cards] = useState<number[]>([]);
  const [team2Cards, setTeam2Cards] = useState<number[]>([]);
  const [noTeamCards, setNoTeamCards] = useState<number[]>([]);
  const [team1ConsolationPoints, setTeam1ConsolationPoints] = useState(0);
  const [team2ConsolationPoints, setTeam2ConsolationPoints] = useState(0);
  const [teamNameInputs, setTeamNameInputs] = useState<[string, string]>([
    "",
    "",
  ]);
  const [started, setStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ding] = useSound(dingSFX);
  const [playWrong] = useSound(wrongSFX);
  const [media, setMedia] = useState({ done: 0, total: 0 });

  useEffect(() => {
    let active = true;
    const urls = [
      answerSFX,
      wrongSFX,
      swooshSFX,
      vinylStopSFX,
      yoshiSFX,
      ...[...quiz.practice, ...quiz.questions].flatMap((q) => q.preload.map(asset)),
    ];
    void preloadMedia(urls, (done, total) => {
      if (active) setMedia({ done, total });
    });
    return () => {
      active = false;
    };
  }, []);
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

  // Overlayet (låge, prøvespørgsmål eller menu) lukker diskanten ude, som bag en dør.
  useMuffle(
    bgsound,
    activeQuestionIndex !== null || practiceIndex !== null || settingsOpen
  );

  const pickQuestion = (index: number, question: Question) => () => {
    setActiveQuestionIndex(index);
    if (question.setVolume && bgsound) {
      bgsound.volume(question.setVolume);
    }
  };

  const endPractice = () => {
    setPracticeIndex(null);
    bgsound?.volume(1);
  };

  const startPractice = (index: number) => {
    const question = quiz.practice[index];
    if (!question) {
      endPractice();
      return;
    }
    setPracticeIndex(index);
    bgsound?.volume(question.setVolume ?? 1);
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
  const teamNames: [string, string] = [
    teamNameInputs[0].trim() || quiz.teamNames[0],
    teamNameInputs[1].trim() || quiz.teamNames[1],
  ];
  const team1Points =
    team1Cards.length * quiz.pointsPerQuestion + team1ConsolationPoints;
  const team2Points =
    team2Cards.length * quiz.pointsPerQuestion + team2ConsolationPoints;
  const adjustConsolation = (team: 1 | 2, amount: number) => {
    if (amount > 0) ding();
    else playWrong();
    if (team === 1) setTeam1ConsolationPoints((current) => current + amount);
    else setTeam2ConsolationPoints((current) => current + amount);
  };
  const activeQuestion =
    activeQuestionIndex !== null ? questions[activeQuestionIndex] : undefined;
  const practiceQuestion =
    practiceIndex !== null ? quiz.practice[practiceIndex] : undefined;

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
    const savedTeamNames = loadTeamNames(quiz.name);
    if (savedTeamNames) setTeamNameInputs(savedTeamNames);
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
    if (!isLoaded) return;
    saveTeamNames(quiz.name, teamNameInputs);
  }, [isLoaded, teamNameInputs]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.repeat) return;
      if (
        (event.key === "m" || event.key === "M") &&
        activeQuestionIndex === null &&
        practiceIndex === null &&
        !(event.target instanceof HTMLInputElement)
      ) {
        setSettingsOpen((open) => !open);
      }
      if (
        (event.key === "p" || event.key === "P") &&
        activeQuestionIndex === null &&
        practiceIndex === null &&
        !settingsOpen
      ) {
        startPractice(0);
      }
      if (event.key === "Escape" && settingsOpen) {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeQuestionIndex, practiceIndex, settingsOpen, bgsound]);

  return (
    <>
      <Stage colors={quiz.colors}>
        {isFinished ? (
          <EndScreen
            teamNames={teamNames}
            points={[team1Points, team2Points]}
            doors={[team1Cards.length, team2Cards.length]}
            onConsolation={(team) => adjustConsolation(team, 5)}
          />
        ) : (
          <>
            <Garland lit={started} />
            <div className="absolute inset-0 flex flex-col gap-[22px] px-[58px] pt-[84px] pb-[26px]">
              <BoardHeader
                lit={started}
                title={quiz.title}
                doorCount={doorCount}
                teamNames={teamNames}
                points={[team1Points, team2Points]}
                onConsolation={(team) => adjustConsolation(team, 5)}
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
                        ? teamNames[0]
                        : status === "team-2"
                        ? teamNames[1]
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
                          practiceIndex === null &&
                          !question.skip
                        }
                        // Sway er slået fra for nu; sæt tilbage til `started` for at lade lågerne vugge med musikken.
                        sway={false}
                        onClick={pickQuestion(index, question)}
                      />
                    );
                  })}
                </div>
              </main>
              <Footer
                opened={allAnswered.length}
                total={doorCount}
                media={media}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            </div>
            {/* Sneen ligger over brættet, men under pointpladerne (z-31), lågen (z-40) og indstillingerne (z-50). */}
            {started && (
              <Snowfall
                color="white"
                radius={[1, 2.5]}
                opacity={[0.15, 0.5]}
                snowflakeCount={90}
                style={{ zIndex: 30 }}
              />
            )}
          </>
        )}
        {activeQuestion && (
          <QuestionScreen
            question={activeQuestion}
            title={`${quiz.doorWord} ${activeQuestionIndex! + 1}`}
            onClose={() => {
              setActiveQuestionIndex(null);
              bgsound?.volume(1);
            }}
            onAnswer={handleAnswer}
            teamNames={teamNames}
          />
        )}
        {practiceQuestion && (
          <QuestionScreen
            // Ny instans pr. spørgsmål, så hasAnswered nulstilles.
            key={practiceQuestion.id}
            question={practiceQuestion}
            title={`Prøve ${practiceIndex! + 1}`}
            teamNames={teamNames}
            onAnswer={() => startPractice(practiceIndex! + 1)}
            onClose={endPractice}
          />
        )}
        {settingsOpen && (
          <SettingsMenu onClose={() => setSettingsOpen(false)}>
            {quiz.practice.length > 0 && (
              <PracticeSetting
                count={quiz.practice.length}
                onStart={() => {
                  setSettingsOpen(false);
                  startPractice(0);
                }}
              />
            )}
            <TeamNamesSetting
              names={teamNameInputs}
              defaults={quiz.teamNames}
              onChange={(team, name) =>
                setTeamNameInputs((current) =>
                  team === 1 ? [name, current[1]] : [current[0], name]
                )
              }
            />
            <TeamPointsSetting
              teamNames={teamNames}
              step={quiz.pointsPerQuestion}
              onAdjust={adjustConsolation}
            />
            <ResetQuizSetting pack={quiz.name} />
          </SettingsMenu>
        )}
      </Stage>
    </>
  );
};
