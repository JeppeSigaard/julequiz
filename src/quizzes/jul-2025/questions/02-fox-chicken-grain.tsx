import { FoxChickenGrain } from "../../../components/FoxChickenGrain";
import { type QuestionSpec } from "../../../types";

const question: QuestionSpec = {
  type: "custom",
  backgroundVolume: 0.5,
  body: <FoxChickenGrain title="Fox chicken grain-off!" />,
  answer: (
    <p className="text-[160px] flex gap-10">
      <span className="animate-bounce">🦊</span>
      <span className="animate-[bounce_1s_100ms_infinite]">🐔</span>
      <span className="animate-[bounce_1s_200ms_infinite]">🌾</span>
    </p>
  ),
};

export default question;
