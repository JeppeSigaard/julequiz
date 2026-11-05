import type { Question } from "./types";

// Kortene er gitterpositioner, så questionIds skal altid gemmes sammen med dem.
export type SavedQuizState = {
  questionIds: string[];
  team1Cards: number[];
  team2Cards: number[];
  noTeamCards: number[];
  team1ConsolationPoints: number;
  team2ConsolationPoints: number;
};

const storageKey = (pack: string) => `julequiz-state-v2:${pack}`;

function isCardArray(value: unknown, count: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        Number.isInteger(item) && item >= 0 && item < count
    )
  );
}

export function loadQuizState(
  pack: string,
  questions: Question[]
): SavedQuizState | null {
  try {
    const raw = localStorage.getItem(storageKey(pack));
    if (raw === null) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const state = data as Record<string, unknown>;

    const { questionIds } = state;
    if (
      !Array.isArray(questionIds) ||
      questionIds.length !== questions.length ||
      !questionIds.every((id) => typeof id === "string")
    ) {
      return null;
    }
    const knownIds = new Set(questions.map((q) => q.id));
    const seenIds = new Set<string>(questionIds);
    if (
      seenIds.size !== questions.length ||
      !questionIds.every((id) => knownIds.has(id))
    ) {
      return null;
    }

    const { team1Cards, team2Cards, noTeamCards } = state;
    const { team1ConsolationPoints, team2ConsolationPoints } = state;
    if (
      !isCardArray(team1Cards, questions.length) ||
      !isCardArray(team2Cards, questions.length) ||
      !isCardArray(noTeamCards, questions.length) ||
      typeof team1ConsolationPoints !== "number" ||
      typeof team2ConsolationPoints !== "number"
    ) {
      return null;
    }

    return {
      questionIds,
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

export function saveQuizState(pack: string, state: SavedQuizState): void {
  try {
    localStorage.setItem(storageKey(pack), JSON.stringify(state));
  } catch {}
}

export function clearQuizState(pack: string): void {
  try {
    localStorage.removeItem(storageKey(pack));
  } catch {}
}

// Holdnavnene gemmes for sig, så "Nulstil quiz" ikke sletter dem.
const teamNamesKey = (pack: string) => `julequiz-team-names-v1:${pack}`;

export function loadTeamNames(pack: string): [string, string] | null {
  try {
    const raw = localStorage.getItem(teamNamesKey(pack));
    if (raw === null) return null;
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    const [team1, team2] = data;
    if (
      data.length !== 2 ||
      typeof team1 !== "string" ||
      typeof team2 !== "string"
    ) {
      return null;
    }
    return [team1, team2];
  } catch {
    return null;
  }
}

export function saveTeamNames(pack: string, names: [string, string]): void {
  try {
    localStorage.setItem(teamNamesKey(pack), JSON.stringify(names));
  } catch {}
}
