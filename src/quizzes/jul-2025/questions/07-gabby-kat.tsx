import { GuessThatCat } from "../../../components/GuessThatCat";
import { type QuestionSpec } from "../../../types";

const images = [
  "/quizzes/jul-2025/images/babybox-hero.png",
  "/quizzes/jul-2025/images/cakey-hero2.png",
  "/quizzes/jul-2025/images/carlita-hero.png",
  "/quizzes/jul-2025/images/catrat-hero3.png",
  "/quizzes/jul-2025/images/djcatnip-hero2.png",
  "/quizzes/jul-2025/images/kittyfairy-hero.png",
  "/quizzes/jul-2025/images/mercat-hero3.png",
  "/quizzes/jul-2025/images/pandy-hero2.png",
  "/quizzes/jul-2025/images/pillowcat-hero.png",
];

const question: QuestionSpec = {
  type: "custom",
  backgroundVolume: 0.7,
  preload: images,
  body: <p className="font-body text-[58px] font-bold text-ink">Hvem er den Gabby-kat?</p>,
  answer: (
    <GuessThatCat
      images={images}
      from={4000}
      to={6000}
      className="w-125 mx-auto"
    />
  ),
};

export default question;
