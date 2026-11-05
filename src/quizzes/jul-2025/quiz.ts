import type { Quiz } from "../../types";

const quiz: Quiz = {
  title: "den store julequiz",
  teamNames: ["Hold 1", "Hold 2"],
  doorWord: "Låge",
  shuffle: true,
  pointsPerQuestion: 100,
  music: {
    background: "/quizzes/jul-2025/audio/waiting-music-116216.mp3",
    finale: "/quizzes/jul-2025/audio/lightning-round.mp3",
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
