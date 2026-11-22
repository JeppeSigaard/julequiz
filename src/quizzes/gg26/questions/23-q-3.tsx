import { type QuestionSpec } from "../../../types";
const question: QuestionSpec = {
  type: "standard",
  question: {
    text: "Hvor mange gaver får man i alt i sangen 'The Twelve Days of Christmas'?",
  },
  answer: {
    text: "364",
    note: "Hver dag gentages alle de foregående dages gaver: 1 + 3 + 6 + … + 78.",
  },
};

export default question;
