"use client";

import { FunctionComponent, ReactNode } from "react";

export const SettingsMenu: FunctionComponent<{
  onClose: () => void;
  children: ReactNode;
}> = (props) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-20"
      onClick={() => props.onClose()}
    >
      <div
        className="bg-green-200 rounded-2xl shadow-2xl p-10 max-w-xl w-full relative"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="relative mb-8">
          <h2 className="text-5xl font-bold font-['Mountains_of_Christmas',Serif] text-center">
            Indstillinger
          </h2>
          <button
            autoFocus
            className="cursor-pointer absolute top-0 right-0 text-xl"
            onClick={() => props.onClose()}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        <div className="flex flex-col gap-6">{props.children}</div>
      </div>
    </div>
  );
};
