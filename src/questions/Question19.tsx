import { type QuestionSpec } from "../types";

export const Question19: QuestionSpec = {
  type: "video",
  backgroundVolume: 0.4,
  video: "/video/letgo.mp4",
  prompt: "Hvor mange personer er der i videoen?",
  answer: { video: "/video/letgoansw.mp4", text: "7" },
};
