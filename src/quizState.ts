import { QUESTIONS } from "./questions";

// Kortene er gitterpositioner, så questionIds skal altid gemmes sammen med dem.
export type SavedQuizState = {
  questionIds: string[];
  team1Cards: number[];
  team2Cards: number[];
  noTeamCards: number[];
  team1ConsolationPoints: number;
  team2ConsolationPoints: number;
};

const STORAGE_KEY = "julequiz-state-v1";

function isCardArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        Number.isInteger(item) && item >= 0 && item < QUESTIONS.length
    )
  );
}

export function loadQuizState(): SavedQuizState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const state = data as Record<string, unknown>;

    const { questionIds } = state;
    if (
      !Array.isArray(questionIds) ||
      questionIds.length !== QUESTIONS.length ||
      !questionIds.every((id) => typeof id === "string")
    ) {
      return null;
    }
    const knownIds = new Set(QUESTIONS.map((q) => q.id));
    const seenIds = new Set<string>(questionIds as string[]);
    if (
      seenIds.size !== QUESTIONS.length ||
      !(questionIds as string[]).every((id) => knownIds.has(id))
    ) {
      return null;
    }

    const { team1Cards, team2Cards, noTeamCards } = state;
    const { team1ConsolationPoints, team2ConsolationPoints } = state;
    if (
      !isCardArray(team1Cards) ||
      !isCardArray(team2Cards) ||
      !isCardArray(noTeamCards) ||
      typeof team1ConsolationPoints !== "number" ||
      typeof team2ConsolationPoints !== "number"
    ) {
      return null;
    }

    return {
      questionIds: questionIds as string[],
      team1Cards,
      team2Cards,
      noTeamCards,
      team1ConsolationPoints,
      team2ConsolationPoints,
    };
  } catch {
    return null;
  }
}

export function saveQuizState(state: SavedQuizState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // privat tilstand eller fuld kvote
  }
}

export function clearQuizState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // privat tilstand
  }
}
