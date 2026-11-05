"use client";

import { FunctionComponent, useState, useEffect } from "react";
import useSound from "use-sound";

import { PillButton } from "./decor";
import { fileExtension, useAsset } from "../mediaCache";

type State = "idle" | "playing" | "stopped";

export const MusicBox: FunctionComponent<{
  track: string;
  start: number;
  stop: number;
}> = (props) => {
  const [state, setState] = useState<State>("idle");
  const [hintCount, setHintCount] = useState(0);

  const src = useAsset(props.track);
  const [play, { stop, sound }] = useSound(src, {
    // En blob-URL har ingen filendelse, så Howler skal have formatet oplyst.
    format: [fileExtension(props.track)],
    interrupt: true,
    onend: () => {
      setState("stopped");
      setHintCount((c) => c + 1);
    },
  });

  const baseDuration = props.stop - props.start;
  const currentDuration = parseFloat(
    (baseDuration * Math.pow(3, hintCount)).toFixed(2)
  );
  const currentStop = props.start + currentDuration;

  const handlePlay = () => {
    play({ playbackRate: 1 });
    sound?.seek(props.start);
    setState("playing");
  };

  useEffect(() => {
    if (state !== "playing" || !sound) return;

    const checkTime = setInterval(() => {
      const currentTime = sound.seek() as number;
      if (currentTime >= currentStop) {
        stop();
        setState("stopped");
        setHintCount((c) => c + 1);
      }
    }, 100);

    return () => {
      clearInterval(checkTime);
      stop();
    };
  }, [state, sound, currentStop, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return (
    <div className="flex flex-col items-center gap-4">
      {state === "idle" && (
        <PillButton
          variant="team-1"
          onClick={handlePlay}
          disabled={!sound}
          className="disabled:cursor-wait disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[44px]">
            play_arrow
          </span>
          Start
        </PillButton>
      )}

      {state === "playing" && (
        <div className="bg-ink/10 text-ink-soft text-[26px] font-black rounded-full px-9 py-5 flex items-center gap-4">
          <span className="material-symbols-outlined text-[44px] animate-pulse">
            graphic_eq
          </span>
          Afspiller...
        </div>
      )}

      {state === "stopped" && (
        <PillButton variant="team-1" onClick={handlePlay}>
          <span className="material-symbols-outlined text-[44px]">
            play_arrow
          </span>
          Spil lidt mere
        </PillButton>
      )}
    </div>
  );
};

export const MusicAnswer: FunctionComponent<{
  track: string;
  song: string;
  artist: string;
  answerStart: number;
}> = (props) => {
  const src = useAsset(props.track);
  const [play, { stop, sound }] = useSound(src, {
    format: [fileExtension(props.track)],
    interrupt: true,
  });

  useEffect(() => {
    if (!sound) return;
    play({ playbackRate: 1 });
    sound.seek(props.answerStart);
    return () => stop();
  }, [sound, play, stop, props.answerStart]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="font-display text-[96px] text-accent-deep leading-none">
        {props.song}
      </div>
      <div className="text-[43px] font-bold text-ink">{props.artist}</div>
    </div>
  );
};
