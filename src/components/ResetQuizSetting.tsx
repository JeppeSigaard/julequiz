"use client";

import { FunctionComponent, useState } from "react";
import { clearQuizState } from "../quizState";

export const ResetQuizSetting: FunctionComponent<{ pack: string }> = (props) => {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex gap-4">
        <button
          className="cursor-pointer font-bold text-lg rounded-xl px-6 py-3 bg-(--color-door) text-white hover:bg-[color-mix(in_oklab,var(--color-door),black_10%)] transition-colors"
          onClick={() => {
            clearQuizState(props.pack);
            window.location.reload();
          }}
        >
          Ja, nulstil quizzen
        </button>
        <button
          className="cursor-pointer font-bold text-lg rounded-xl px-6 py-3 bg-(--color-doorDone)/20 hover:bg-(--color-doorDone)/30 transition-colors"
          onClick={() => setConfirming(false)}
        >
          Annuller
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <button
        className="cursor-pointer font-bold text-lg rounded-xl px-6 py-3 bg-(--color-doorDone) text-white hover:bg-[color-mix(in_oklab,var(--color-doorDone),black_10%)] transition-colors"
        onClick={() => setConfirming(true)}
      >
        Nulstil quiz
      </button>
      <p className="text-sm">
        Sletter point og lågernes rækkefølge og starter forfra.
      </p>
    </div>
  );
};
