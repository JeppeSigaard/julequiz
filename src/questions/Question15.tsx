import { type QuestionSpec } from "../types";

export const Question15: QuestionSpec = {
  type: "video",
  backgroundVolume: 0.1,
  video: "/video/trille.mov",
  prompt: "Hvad synger trille?",
  caption: "Hjemmevideo",
  answer: { text: "Valdes Jul", note: "Christopher", audio: "/audio/Valdes Jul.mp3#t=00:00:50" },
};
