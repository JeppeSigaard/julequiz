"use client";

import { FunctionComponent, useState, useEffect, useMemo } from "react";
import useSound from "use-sound";

import track1 from "../audio/Christmas Lights.mp3";
import track2 from "../audio/Driving Home for Christmas.mp3";
import track3 from "../audio/Jingle Bell Rock.mp3";
import track4 from "../audio/Last Christmas.mp3";
import track5 from "../audio/Snowman.mp3";

const CONFIG = [
  {
    track: track1,
    song: "Christmas Lights",
    artist: "Coldplay",
    start: 7.7,
    stop: 8,
    answerStart: 132.5,
  },
  {
    track: track2,
    song: "Driving Home for Christmas",
    artist: "Chris Rea",
    start: 0,
    stop: 0.5,
    answerStart: 22.3,
  },
  {
    track: track3,
    song: "Jingle Bell Rock",
    artist: "Bobby Helms",
    start: 1.2,
    stop: 1.5,
    answerStart: 7.3,
  },
  {
    track: track4,
    song: "Last Christmas",
    artist: "Wham!",
    start: 0.2,
    stop: 0.45,
    answerStart: 17.5,
  },
  {
    track: track5,
    song: "Snowman",
    artist: "Sia",
    start: 0.5,
    stop: 2,
    answerStart: 48.6,
  },
];

type State = "idle" | "playing" | "stopped" | "revealed";

export const MusicBox: FunctionComponent<{ index?: number }> = (props) => {
  const [state, setState] = useState<State>("idle");
  const [hintCount, setHintCount] = useState(0);
  const [selectedTrack] = useState(
    () => CONFIG[props.index ?? Math.floor(Math.random() * CONFIG.length)]!
  );

  const [play, { stop, sound }] = useSound(selectedTrack.track, {
    interrupt: true,
  });

  const baseDuration = selectedTrack.stop - selectedTrack.start;
  const currentDuration = parseFloat(
    (baseDuration * Math.pow(3, hintCount)).toFixed(2)
  );
  const currentStop = selectedTrack.start + currentDuration;

  const handlePlay = () => {
    play({ playbackRate: 1 });
    sound?.seek(selectedTrack.start);
    setState("playing");
  };

  const handleReveal = () => {
    play({ playbackRate: 1 });
    sound?.seek(selectedTrack.answerStart);
    setState("revealed");
  };

  // Seek to start position once sound is loaded (for first play)
  useEffect(() => {
    if (state === "playing" && sound) {
      sound.seek(selectedTrack.start);
    }
  }, [sound, state, selectedTrack.start]);

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
          <div className="text-7xl font-bold">{selectedTrack.song}</div>
          <div className="text-4xl">{selectedTrack.artist}</div>
        </div>
      )}
    </div>
  );
};
