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
};

export default quiz;
