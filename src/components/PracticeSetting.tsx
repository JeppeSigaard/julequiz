"use client";

import { FunctionComponent } from "react";
import { PillButton } from "./decor";

export const PracticeSetting: FunctionComponent<{
  onStart: () => void;
  count: number;
}> = (
  props
) => (
  <div className="flex flex-col gap-4 items-start">
    <PillButton variant="dark" onClick={props.onStart}>
      Start prøverunde
    </PillButton>
    <p className="text-[22px] font-semibold text-ink-soft">
      {props.count} prøvespørgsmål, der ikke giver point. Genvej: P.
    </p>
  </div>
);
