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
          ? "bg-(--color-doorHighlight) hover:bg-[color-mix(in_oklab,var(--color-doorHighlight),white_30%)] cursor-pointer text-white shadow-lg"
          : props.active
          ? "bg-(--color-door) hover:bg-(--color-doorHighlight) cursor-pointer text-white shadow-lg"
          : "bg-(--color-doorDone) cursor-not-allowed text-(--color-board)"
      )}
      onClick={handleClick}
    >
      {props.number}
    </button>
  );
};
