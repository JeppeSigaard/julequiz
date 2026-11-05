import { FunctionComponent } from "react";
import { type Question } from "../types";
import openSFX from "../sfx/levelup.mp3";
import useSound from "use-sound";
import classNames from "classnames";

export const QuestionCard: FunctionComponent<{
  number: number;
  question: Question;
  onClick: () => void;
  active: boolean;
  contrast?: boolean;
}> = (props) => {
  const [play] = useSound(openSFX);
  const handleClick = () => {
    play();
    props.onClick();
  };

  return (
    <button
      disabled={!props.active}
      type="button"
      className={classNames(
        "transition-colors duration-500 rounded-xl aspect-video font-extrabold text-6xl",
        props.active && props.contrast
          ? "bg-red-400 hover:bg-red-300 cursor-pointer text-white shadow-lg"
          : props.active
          ? "bg-red-500 hover:bg-red-400 cursor-pointer text-white shadow-lg"
          : "bg-green-800 cursor-not-allowed text-green-700"
      )}
      onClick={handleClick}
    >
      {props.number}
    </button>
  );
};
