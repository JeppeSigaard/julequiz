"use client";

import { FunctionComponent, ReactNode } from "react";
import { Paper } from "./decor";

export const SettingsMenu: FunctionComponent<{
  onClose: () => void;
  children: ReactNode;
}> = (props) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 backdrop-blur-[4px]"
      onClick={() => props.onClose()}
    >
      {/* Wrapperen findes, fordi Paper ikke videresender handlers */}
      <div
        role="dialog"
        aria-label="Indstillinger"
        onClick={(event) => event.stopPropagation()}
      >
        <Paper className="w-[880px] px-[64px] pb-[56px]">
          <div className="relative flex flex-col items-center">
            <div className="-mt-0.5 flex items-start">
              <div aria-hidden="true" className="mt-[16px] -mr-[13px] h-[58px] w-[42px] bg-accent-deep [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,34%_50%)]" />
              <h2 className="relative rounded-b-[18px] bg-accent px-[50px] pt-2 pb-[13px] font-display text-[60px] font-bold leading-none text-paper-lit shadow-[0_5px_0_color-mix(in_oklab,var(--quiz-accent)_72%,black)]">
                Indstillinger
              </h2>
              <div aria-hidden="true" className="mt-[16px] -ml-[13px] h-[58px] w-[42px] bg-accent-deep [clip-path:polygon(0_0,100%_0,66%_50%,100%_100%,0_100%)]" />
            </div>
            <button
              autoFocus
              type="button"
              aria-label="Luk indstillinger"
              className="absolute right-[-36px] top-[26px] flex size-[52px] cursor-pointer items-center justify-center rounded-full bg-ink/10 text-ink"
              onClick={() => props.onClose()}
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
            <div className="relative mt-[44px] flex flex-col gap-[28px]">
              {props.children}
            </div>
          </div>
        </Paper>
      </div>
    </div>
  );
};
