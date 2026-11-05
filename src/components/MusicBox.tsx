"use client";

import { FunctionComponent, useState, useEffect, useMemo } from "react";
import useSound from "use-sound";

type State = "idle" | "playing" | "stopped" | "revealed";

export const MusicBox: FunctionComponent<{
  track: string;
  song: string;
  artist: string;
  start: number;
  stop: number;
  answerStart: number;
}> = (props) => {
  const [state, setState] = useState<State>("idle");
  const [hintCount, setHintCount] = useState(0);

  const [play, { stop, sound }] = useSound(props.track, {
    interrupt: true,
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

  const handleReveal = () => {
    play({ playbackRate: 1 });
    sound?.seek(props.answerStart);
    setState("revealed");
  };

  // Seek to start position once sound is loaded (for first play)
  useEffect(() => {
    if (state === "playing" && sound) {
      sound.seek(props.start);
    }
  }, [sound, state, props.start]);

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
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">play_arrow</span>
          Start
        </button>
      )}

      {state === "playing" && (
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-full">
          <span className="material-symbols-outlined animate-pulse">
            graphic_eq
          </span>
          Afspiller...
        </div>
      )}

      {state === "stopped" && (
        <div className="flex gap-4">
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">play_arrow</span>
            Spil lidt mere
          </button>
          <button
            onClick={handleReveal}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">visibility</span>
            Vis svar
          </button>
        </div>
      )}

      {state === "revealed" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-7xl font-bold">{props.song}</div>
          <div className="text-4xl">{props.artist}</div>
        </div>
      )}
    </div>
  );
};
