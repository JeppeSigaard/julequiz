import { toQuestion } from "../questionTypes";
import type { Question, QuestionSpec, Quiz } from "../types";

const quizModules = import.meta.glob<{ default: Quiz }>("./*/quiz.ts", {
  eager: true,
});
const questionModules = import.meta.glob<{ default: QuestionSpec }>(
  "./*/questions/*.tsx",
  { eager: true }
);

export type LoadedQuiz = Quiz & { name: string; questions: Question[] };

const specsByPack = new Map<string, { id: string; spec: QuestionSpec }[]>();
for (const [path, mod] of Object.entries(questionModules)) {
  const match = /^\.\/([^/]+)\/questions\/([^/]+)\.tsx$/.exec(path);
  if (!match) continue;
  const pack = match[1]!;
  const id = match[2]!;
  const list = specsByPack.get(pack) ?? [];
  list.push({ id, spec: mod.default });
  specsByPack.set(pack, list);
}

const loaded: LoadedQuiz[] = [];
for (const [path, mod] of Object.entries(quizModules)) {
  const match = /^\.\/([^/]+)\/quiz\.ts$/.exec(path);
  if (!match) continue;
  const name = match[1]!;
  // Glob-nøglernes rækkefølge er ingen kontrakt; filnavnet bestemmer rækkefølgen.
  const entries = [...(specsByPack.get(name) ?? [])].sort((a, b) =>
    a.id < b.id ? -1 : 1
  );
  loaded.push({
    ...mod.default,
    name,
    questions: entries.map((e) => toQuestion(e.spec, e.id)),
  });
}
loaded.sort((a, b) => (a.name < b.name ? -1 : 1));

// Map, så ?quiz=constructor er en ukendt quiz og ikke et prototype-opslag.
export const QUIZZES = new Map<string, LoadedQuiz>(
  loaded.map((quiz) => [quiz.name, quiz])
);
