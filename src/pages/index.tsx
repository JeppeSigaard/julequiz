import { QuizPage } from "../components/QuizPage";
import { DEFAULT_QUIZ } from "../config";

export default async function HomePage() {
  return <QuizPage name={DEFAULT_QUIZ} />;
}

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
