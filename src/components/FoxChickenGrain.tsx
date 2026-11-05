"use client";

import { useState, useCallback } from "react";

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

export function FoxChickenGrain() {
  const [state, setState] = useState<GameState>(initialState);
  const [message, setMessage] = useState<string>("Få alle over åen!");
  const [isWon, setIsWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

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
    if (isWon) return;

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
    if (isWon) return;

    const newBoatSide: Side = state.boat === "left" ? "right" : "left";
    const cargo = state.boatCargo;

    const newState: GameState = {
      ...state,
      boat: newBoatSide,
      boatCargo: null,
      ...(cargo ? { [cargo]: newBoatSide } : {}),
    };

    // Check for game over after the boat leaves
    if (checkGameOver(newState)) {
      setIsGameOver(true);
      if (
        newState.chicken === newState.fox &&
        newState.chicken !== newBoatSide
      ) {
        setMessage("🦊 Ræven spiste hønen!");
      } else {
        setMessage("🐔 Hønen spiste kornet!");
      }
      setTimeout(() => {
        setState(initialState);
        setMessage("Få alle over åen!");
        setIsGameOver(false);
      }, 3000);
      return;
    }

    setState(newState);

    if (checkWin(newState)) {
      setMessage("🎉 Tillykke! Du løste gåden!");
      setIsWon(true);
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
        className={`text-5xl p-3 rounded-xl transition-all duration-200 ${
          canInteract
            ? "hover:scale-110 hover:bg-white/20 cursor-pointer"
            : "opacity-50 cursor-not-allowed"
        }`}
        title={item.charAt(0).toUpperCase() + item.slice(1)}
      >
        {icons[item]}
      </button>
    );
  };

  const renderBoat = () => {
    const boatPosition = state.boat === "left" ? "top-0" : "bottom-0";
    const cargo = state.boatCargo;

    const icons: Record<Item, string> = {
      fox: "🦊",
      chicken: "🐔",
      grain: "🌾",
    };

    return (
      <button
        onClick={handleBoatClick}
        className={`absolute ${boatPosition} left-1/2 -translate-x-1/2 transition-all duration-700 ease-in-out cursor-pointer hover:scale-105`}
        title="Click to sail"
      >
        <div className="flex items-center gap-2">
          <div className="text-6xl">🚣</div>
          {cargo && (
            <span
              className="text-4xl cursor-pointer hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(cargo);
              }}
            >
              {icons[cargo]}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-80 h-96 rounded-xl overflow-hidden">
        {/* Game over overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center">
            <div className="text-center">
              <span className="text-red-500 text-xl font-bold block mb-2">
                {message}
              </span>
              <span className="text-white/70 text-sm">
                Spillet starter forfra...
              </span>
            </div>
          </div>
        )}

        {/* Top bank */}
        <div className="absolute left-0 right-0 top-0 h-[30%] bg-green-600 flex items-center justify-center gap-2">
          <div className="flex gap-2">
            {(["fox", "chicken", "grain"] as Item[]).map((item) =>
              renderItem(item, "left")
            )}
          </div>
        </div>

        {/* River */}
        <div className="absolute top-[30%] bottom-[30%] left-0 right-0 bg-blue-500">
          {renderBoat()}
          {message && !isGameOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white text-center text-sm font-medium bg-black/50 px-3 py-1 rounded-lg">
                {message}
              </span>
            </div>
          )}
        </div>

        {/* Bottom bank */}
        <div className="absolute left-0 right-0 bottom-0 h-[30%] bg-green-600 flex items-center justify-center gap-2">
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
