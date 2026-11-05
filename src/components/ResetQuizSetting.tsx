"use client";

import { FunctionComponent, useState } from "react";
import { clearQuizState } from "../quizState";
import { PillButton } from "./decor";

export const ResetQuizSetting: FunctionComponent<{ pack: string }> = (props) => {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex gap-6">
        <PillButton
          variant="team-1"
          onClick={() => {
            clearQuizState(props.pack);
            window.location.reload();
          }}
        >
          Ja, nulstil quizzen
        </PillButton>
        <PillButton variant="neutral" onClick={() => setConfirming(false)}>
          Annuller
        </PillButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 items-start">
      <PillButton variant="dark" onClick={() => setConfirming(true)}>
        Nulstil quiz
      </PillButton>
      <p className="text-[22px] font-semibold text-ink-soft">
        Sletter point og lågernes rækkefølge og starter forfra.
      </p>
    </div>
  );
};
