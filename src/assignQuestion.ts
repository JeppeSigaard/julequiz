import type { Question } from "./types";

const minDoor = (question: Question) => question.minDoor ?? 1;

export function assignQuestion(
  pool: Question[],
  freeDoors: number[],
  door: number,
  recentTypes: string[]
): Question {
  const doorsLeft = freeDoors.filter((d) => d !== door);
  const usable = pool.filter((candidate) => {
    if (minDoor(candidate) > door) return false;
    const rest = pool.filter((q) => q !== candidate);
    // Spørgsmål med minDoor skal stadig have en ledig låge, når denne låge er brugt.
    return rest.every(
      (q) =>
        q.minDoor === undefined ||
        rest.filter((r) => minDoor(r) >= minDoor(q)).length <=
          doorsLeft.filter((d) => d >= minDoor(q)).length
    );
  });
  const candidates = usable.length > 0 ? usable : pool;

  const counts = new Map<string, number>();
  for (const q of candidates) counts.set(q.type, (counts.get(q.type) ?? 0) + 1);
  let weights = [...counts].map(
    ([type, count]) =>
      [
        type,
        count *
          (type === recentTypes[0] ? 0 : type === recentTypes[1] ? 0.5 : 1),
      ] as const
  );
  if (weights.every(([, weight]) => weight === 0)) weights = [...counts];

  let roll = Math.random() * weights.reduce((sum, [, weight]) => sum + weight, 0);
  let chosen = weights[weights.length - 1]![0];
  for (const [type, weight] of weights) {
    if (weight > 0 && roll < weight) {
      chosen = type;
      break;
    }
    roll -= weight;
  }
  const ofType = candidates.filter((q) => q.type === chosen);
  return ofType[Math.floor(Math.random() * ofType.length)]!;
}
