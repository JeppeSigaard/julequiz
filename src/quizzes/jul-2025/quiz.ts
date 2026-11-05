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
  snow: true,
  titleFont: "Mountains of Christmas",
  colors: {
    page: "#032e15",
    board: "#008236",
    door: "#fb2c36",
    doorHighlight: "#ff6467",
    doorDone: "#016630",
    screen: "#b9f8cf",
    text: "#000000",
  },
};

export default quiz;
