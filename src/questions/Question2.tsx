import { FoxChickenGrain } from "../components/FoxChickenGrain";
import { type QuestionSpec } from "../types";

export const Question2: QuestionSpec = {
  type: "custom",
  backgroundVolume: 0.5,
  body: (
    <>
      <h2 className="text-6xl mb-10 font-extrabold">Fox chicken grain-off!</h2>
      <div className="flex gap-10">
        <FoxChickenGrain />
        <FoxChickenGrain />
      </div>
    </>
  ),
  answer: (
    <p className="text-8xl flex gap-10">
      <span className="animate-bounce">🦊</span>
      <span className="animate-[bounce_1s_100ms_infinite]">🐔</span>
      <span className="animate-[bounce_1s_200ms_infinite]">🌾</span>
    </p>
  ),
};
