import { type Question } from "../types";
import { asset } from "../asset";
export const Question14: Question = {
  id: "14",
  setVolume: 0.05,
  body: (
    <>
      <video
        autoPlay
        controls={false}
        src={asset("/video/viersaasode.mp4")}
        className="w-175"
      />
      <p className="text-4xl mt-4">
        Hvad hedder julekalenderen fra 1997, hvor nizzerne ikke kan sove for al
        larmen?
      </p>
    </>
  ),
  answer: <img src={asset("/images/tunnel.png")} className="mx-auto w-225" />,
};
