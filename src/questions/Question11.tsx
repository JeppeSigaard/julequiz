import { useState } from "react";
import { type QuestionSpec } from "../types";
import { asset } from "../asset";
import classNames from "classnames";

const VideoQuestion = () => {
  const [end, setEnd] = useState(false);

  return (
    <>
      <div className="relative flex justify-center items-center w-300 aspect-video rounded-2xl overflow-hidden">
        <video
          autoPlay
          controls={false}
          src={asset("/video/bertelq-2.mp4")}
          className={classNames("transition-opacity", end && "opacity-25")}
          onEnded={() => setEnd(true)}
        />
        {end && (
          <p className="absolute top-1/2 w-full text-center left-0 -translate-y-1/2 text-7xl font-bold">
            Hvor skal Bertel hen?
          </p>
        )}
      </div>
      <p className="text-3xl mt-4">
        Bertel Haarder har ikke tid til at svare på kritiske spørgsmål om
        fedmeoperationer (20. december 2010).
      </p>
    </>
  );
};

export const Question11: QuestionSpec = {
  type: "custom",
  backgroundVolume: 0.1,
  body: <VideoQuestion />,
  answer: (
    <>
      <div className="flex justify-center items-center w-300 aspect-video rounded-2xl overflow-hidden">
        <video autoPlay controls={false} src={asset("/video/bertala-2.mp4")} />
      </div>
    </>
  ),
};
