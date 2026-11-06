import type { Quiz } from "../../types";

const quiz: Quiz = {
  title: "Den Store Julequiz",
  teamNames: ["Hold 1", "Hold 2"],
  doorWord: "Låge",
  shuffle: true,
  pointsPerQuestion: 100,
  music: {
    background: "/quizzes/gg26/audio/waiting-music-116216.mp3",
    finale: "/quizzes/gg26/audio/christmas-disco-groove.mp3",
  },
  colors: {
    background: "#0e2c22",
    paper: "#f6ecd9",
    ink: "#12372a",
    accent: "#d2393f",
    highlight: "#f2c14e",
    team1: "#d2393f",
    team2: "#f2c14e",
  },
};

export default quiz;
