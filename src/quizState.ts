import type { Question } from "./types";

// Kortene er lågeindekser, så tildelingerne skal altid gemmes sammen med dem.
export type Assignment = { door: number; id: string };

export type DoorValue = { door: number; value: number };

export type SavedQuizState = {
  assignments: Assignment[];
  doorValues: DoorValue[];
  team1Cards: number[];
  team2Cards: number[];
  noTeamCards: number[];
  team1ConsolationPoints: number;
  team2ConsolationPoints: number;
};

const storageKey = (pack: string) => `julequiz-state-v4:${pack}`;

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

    const { assignments } = state;
    if (!Array.isArray(assignments)) return null;
    const knownIds = new Set(questions.map((q) => q.id));
    const seenDoors = new Set<number>();
    const seenIds = new Set<string>();
    const restored: Assignment[] = [];
    for (const item of assignments as unknown[]) {
      if (typeof item !== "object" || item === null) return null;
      const { door, id } = item as Record<string, unknown>;
      if (
        typeof door !== "number" ||
        !Number.isInteger(door) ||
        door < 0 ||
        door >= questions.length ||
        typeof id !== "string" ||
        !knownIds.has(id) ||
        seenDoors.has(door) ||
        seenIds.has(id)
      ) {
        return null;
      }
      seenDoors.add(door);
      seenIds.add(id);
      restored.push({ door, id });
    }

    const { doorValues } = state;
    if (!Array.isArray(doorValues)) return null;
    const valuedDoors = new Set<number>();
    const restoredValues: DoorValue[] = [];
    for (const item of doorValues as unknown[]) {
      if (typeof item !== "object" || item === null) return null;
      const { door, value } = item as Record<string, unknown>;
      if (
        typeof door !== "number" ||
        !Number.isInteger(door) ||
        door < 0 ||
        door >= questions.length ||
        valuedDoors.has(door) ||
        typeof value !== "number" ||
        !Number.isFinite(value)
      ) {
        return null;
      }
      valuedDoors.add(door);
      restoredValues.push({ door, value });
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
      assignments: restored,
      doorValues: restoredValues,
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
