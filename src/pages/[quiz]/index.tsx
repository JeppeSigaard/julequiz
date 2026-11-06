import type { PageProps } from "waku/router";
import { QuizPage } from "../../components/QuizPage";

// Ikke-eager, så den eager indlæste QUIZZES (spørgsmål og renderere) ikke når serverbygget.
const packFiles = Object.keys(import.meta.glob("../../quizzes/*/quiz.ts"));
const packNames = packFiles.flatMap((file) => {
  const name = /\/quizzes\/([^/]+)\/quiz\.ts$/.exec(file)?.[1];
  return name ? [name] : [];
});

export default async function QuizRoute({ quiz }: PageProps<"/[quiz]">) {
  return <QuizPage name={quiz} />;
}

export const getConfig = async () => {
  return {
    render: "static",
    staticPaths: packNames,
  } as const;
};
