import { FunctionComponent, useState, useEffect, useCallback } from "react";
import classNames from "classnames";

export const WordPuzzle: FunctionComponent<{
  word: string;
  className?: string;
  onCorrectGuess?: () => void;
  onIncorrectGuess?: () => void;
}> = (props) => {
  const [revealedChars, setRevealedChars] = useState<Set<string>>(new Set());
  const [isShaking, setIsShaking] = useState(false);
  const [wrongChar, setWrongChar] = useState<string | null>(null);

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toUpperCase();
    const wordUpper = props.word.toUpperCase();

    if (key.length === 1 && /[A-ZÆØÅ]/.test(key)) {
      if (wordUpper.includes(key)) {
        props.onCorrectGuess?.();
        setRevealedChars((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      } else {
        props.onIncorrectGuess?.();
        setWrongChar(key);
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
          setWrongChar(null);
        }, 500);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className={classNames(
        "flex flex-wrap gap-4 justify-center items-center relative",
        isShaking && "animate-shake"
      )}
      style={{
        animation: isShaking ? "shake 0.5s ease-in-out" : undefined,
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
      {wrongChar && (
        <div
          className={classNames(
            "absolute py-1 px-5 z-20 top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-paper bg-accent font-bold opacity-75 shadow-2xl pointer-events-none flex items-center justify-center rounded-xl",
            props.className ?? "text-6xl"
          )}
        >
          {wrongChar}
        </div>
      )}
      {props.word.split("").map((char, index) => {
        const isSpace = char === " ";
        const isRevealed = revealedChars.has(char.toUpperCase());

        if (isSpace) {
          return <div key={index} className="w-8" />;
        }

        return (
          <div
            key={index}
            className={classNames(
              "relative flex items-center justify-center rounded-[14px] size-[1.5em] bg-paper-lit shadow-[0_5px_0_color-mix(in_oklab,var(--quiz-paper)_80%,black)]",
              props.className ?? "text-6xl"
            )}
          >
            {/* Bogstavsfarven sættes her, så className ikke kan overstyre den */}
            <span
              className={classNames(
                "font-body font-black text-ink transition-opacity duration-300",
                isRevealed ? "opacity-100" : "opacity-0"
              )}
            >
              {char.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
};
