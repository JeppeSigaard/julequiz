"use client";

import { useState, useCallback, useEffect } from "react";
import * as motion from "motion/react-client";
import { PillButton } from "./decor";

type Side = "left" | "right";
type Item = "fox" | "chicken" | "grain";

interface GameState {
  fox: Side;
  chicken: Side;
  grain: Side;
  boat: Side;
  boatCargo: Item | null;
}

const initialState: GameState = {
  fox: "left",
  chicken: "left",
  grain: "left",
  boat: "left",
  boatCargo: null,
};

const SAIL_SECONDS = 0.9;
// Åens højde (216 px) minus bådens højde (96 px)
const SAIL_DISTANCE = 120;

interface RiverBoardProps {
  locked: boolean;
  highlighted: boolean;
  moves: number;
  onCross: () => void;
  onWin: () => void;
}

function RiverBoard({ locked, highlighted, moves, onCross, onWin }: RiverBoardProps) {
  const [state, setState] = useState<GameState>(initialState);
  const [message, setMessage] = useState<string>("Få alle over åen!");
  const [isWon, setIsWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [arrival, setArrival] = useState<{
    next: GameState;
    cargo: Item | null;
  } | null>(null);

  useEffect(() => {
    if (arrival === null) return;
    const timer = setTimeout(
      () => land(arrival.next, arrival.cargo),
      SAIL_SECONDS * 1000
    );
    return () => clearTimeout(timer);
  }, [arrival]);

  useEffect(() => {
    if (!isGameOver) return;
    const timer = setTimeout(() => {
      setState(initialState);
      setMessage("Få alle over åen!");
      setIsGameOver(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isGameOver]);

  const checkGameOver = useCallback((newState: GameState): boolean => {
    const { fox, chicken, grain, boat } = newState;

    // Check if chicken is left alone with fox (without the farmer/boat)
    if (chicken === fox && chicken !== boat) {
      return true;
    }

    // Check if chicken is left alone with grain (without the farmer/boat)
    if (chicken === grain && chicken !== boat) {
      return true;
    }

    return false;
  }, []);

  const checkWin = useCallback((newState: GameState): boolean => {
    return (
      newState.fox === "right" &&
      newState.chicken === "right" &&
      newState.grain === "right"
    );
  }, []);

  const handleItemClick = (item: Item) => {
    if (locked || isWon || arrival !== null) return;

    const itemSide = state[item];
    const boatSide = state.boat;

    // Can only interact with items on the same side as the boat
    if (itemSide !== boatSide) {
      setMessage("Den er på den anden side af åen!");
      return;
    }

    // If item is already on the boat, put it back on shore
    if (state.boatCargo === item) {
      setState((prev) => ({ ...prev, boatCargo: null }));
      setMessage("Fjernet fra båden.");
      return;
    }

    // If boat already has cargo, can't add more
    if (state.boatCargo !== null) {
      setMessage("Båden kan kun bære én ting ad gangen!");
      return;
    }

    // Put item on boat
    setState((prev) => ({ ...prev, boatCargo: item }));
    const itemNames: Record<Item, string> = {
      fox: "Ræven",
      chicken: "Hønen",
      grain: "Kornet",
    };
    setMessage(`${itemNames[item]} er på båden.`);
  };

  const handleBoatClick = () => {
    if (locked || isWon || isGameOver || arrival !== null) return;

    const newBoatSide: Side = state.boat === "left" ? "right" : "left";
    const cargo = state.boatCargo;

    const next: GameState = {
      ...state,
      boat: newBoatSide,
      boatCargo: null,
      ...(cargo ? { [cargo]: newBoatSide } : {}),
    };

    setState({ ...state, boat: newBoatSide });
    setArrival({ next, cargo });
    setMessage("");
    onCross();
  };

  const land = (next: GameState, cargo: Item | null) => {
    setArrival(null);
    setState(next);

    // Check for game over after the boat leaves
    if (checkGameOver(next)) {
      setIsGameOver(true);
      if (next.chicken === next.fox && next.chicken !== next.boat) {
        setMessage("🦊 Ræven spiste hønen!");
      } else {
        setMessage("🐔 Hønen spiste kornet!");
      }
      return;
    }

    if (checkWin(next)) {
      setMessage("🎉 Tillykke! Du løste gåden!");
      setIsWon(true);
      onWin();
      return;
    }

    const cargoNames: Record<Item, string> = {
      fox: "ræven",
      chicken: "hønen",
      grain: "kornet",
    };
    setMessage(
      cargo ? `Sejlede over med ${cargoNames[cargo]}!` : "Sejlede over alene."
    );
  };

  const renderItem = (item: Item, side: Side) => {
    const itemSide = state[item];
    const isOnBoat = state.boatCargo === item;

    // Only render if item is on this side and not on the boat
    if (itemSide !== side || isOnBoat) return null;

    const icons: Record<Item, string> = {
      fox: "🦊",
      chicken: "🐔",
      grain: "🌾",
    };

    const canInteract = state.boat === side;

    return (
      <button
        key={item}
        onClick={() => handleItemClick(item)}
        className={`text-[72px] leading-none p-3 rounded-xl transition-all duration-200 ${
          canInteract
            ? "hover:scale-110 hover:bg-snow/20 cursor-pointer"
            : "opacity-50 cursor-not-allowed"
        }`}
        title={item.charAt(0).toUpperCase() + item.slice(1)}
      >
        {icons[item]}
      </button>
    );
  };

  const renderBoat = () => {
    const cargo = state.boatCargo;

    const icons: Record<Item, string> = {
      fox: "🦊",
      chicken: "🐔",
      grain: "🌾",
    };

    return (
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <motion.button
          onClick={handleBoatClick}
          className="h-[96px] flex items-center cursor-pointer hover:scale-105"
          title="Sejl over"
          initial={false}
          animate={{
            y: state.boat === "left" ? 0 : SAIL_DISTANCE,
            rotate:
              state.boat === "left" ? [0, -8, 6, -4, 0] : [0, 8, -6, 4, 0],
          }}
          transition={{ duration: SAIL_SECONDS, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-2">
            <div className="text-[88px] leading-none">🚣</div>
            {cargo && (
              <span
                className="text-[56px] leading-none cursor-pointer hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(cargo);
                }}
              >
                {icons[cargo]}
              </span>
            )}
          </div>
        </motion.button>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col items-center rounded-[24px] transition-opacity duration-300 ${
        highlighted ? "ring-8 ring-highlight" : ""
      } ${locked ? "opacity-40 pointer-events-none" : ""}`}
    >
      <div className="relative w-[520px] h-[540px] rounded-[24px] overflow-hidden">
        <div className="absolute left-3 top-3 z-30 flex flex-col items-center rounded-[14px] bg-paper px-3 pt-1 pb-1.5 text-ink">
          <span className="font-display text-[44px] font-bold leading-none">
            {moves}
          </span>
          <span className="font-body text-[16px] font-extrabold uppercase text-ink-soft">
            træk
          </span>
        </div>
        {/* Game over overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-felt-deep/90 z-20 flex items-center justify-center">
            <div className="text-center">
              <span className="text-highlight font-display text-[43px] block mb-2">
                {message}
              </span>
              <span className="text-snow font-body text-[26px]">
                Spillet starter forfra...
              </span>
            </div>
          </div>
        )}

        {/* Top bank */}
        <div className="absolute left-0 right-0 top-0 h-[162px] bg-felt border-b-4 border-felt-deep flex items-center justify-center gap-2">
          <div className="flex gap-2">
            {(["fox", "chicken", "grain"] as Item[]).map((item) =>
              renderItem(item, "left")
            )}
          </div>
        </div>

        {/* River */}
        <div className="absolute top-[162px] bottom-[162px] left-0 right-0 bg-felt-deep">
          <div className="absolute inset-0 bg-mist/40" />
          <div className="absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 bg-mist/20" />
          {renderBoat()}
          {message && !isGameOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-snow text-center text-[26px] leading-tight font-bold bg-felt-deep/80 px-5 py-2 rounded-xl">
                {message}
              </span>
            </div>
          )}
        </div>

        {/* Bottom bank */}
        <div className="absolute left-0 right-0 bottom-0 h-[162px] bg-felt border-t-4 border-felt-deep flex items-center justify-center gap-2">
          <div className="flex gap-2">
            {(["fox", "chicken", "grain"] as Item[]).map((item) =>
              renderItem(item, "right")
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FoxChickenGrain({ title }: { title: string }) {
  const [round, setRound] = useState(0);
  const [moves, setMoves] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState<0 | 1 | null>(null);
  const [won, setWon] = useState<[boolean, boolean]>([false, false]);

  const isActive = (i: 0 | 1) => {
    const other = i === 0 ? 1 : 0;
    return !won[i] && (turn === null || turn === i || won[other]);
  };

  const restart = () => {
    setRound((r) => r + 1);
    setMoves([0, 0]);
    setTurn(null);
    setWon([false, false]);
  };

  const board = (i: 0 | 1) => (
    <RiverBoard
      key={`${round}-${i}`}
      locked={!won[i] && !isActive(i)}
      highlighted={isActive(i)}
      moves={moves[i]}
      onCross={() => {
        setMoves((prev) => (i === 0 ? [prev[0] + 1, prev[1]] : [prev[0], prev[1] + 1]));
        setTurn(i === 0 ? 1 : 0);
      }}
      onWin={() => setWon((prev) => (i === 0 ? [true, prev[1]] : [prev[0], true]))}
    />
  );

  return (
    <>
      <div className="flex items-center gap-10">
        <h2 className="font-display text-[58px] text-ink leading-none">{title}</h2>
        <PillButton variant="neutral" onClick={restart}>
          Start forfra
        </PillButton>
      </div>
      <div className="flex gap-[60px]">
        {board(0)}
        {board(1)}
      </div>
    </>
  );
}
