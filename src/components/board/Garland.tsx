import type { FC } from "react";

const WIDTH = 1920;
const SPACING = 78;

const wireY = (x: number) => 26 + 21.6 * Math.sin((x / WIDTH) * Math.PI * 4);

const WIRE_PATH = (() => {
  let path = `M0 ${wireY(0).toFixed(1)}`;
  for (let x = 24; x <= WIDTH; x += 24) path += ` L${x} ${wireY(x).toFixed(1)}`;
  return path;
})();

const BULB_COLORS = ["text-accent", "text-highlight", "text-snow", "text-mist"];

const BULBS = Array.from({ length: Math.floor(WIDTH / SPACING) }, (_, k) => {
  const x = SPACING / 2 + k * SPACING;
  return { x, y: wireY(x), color: BULB_COLORS[k % BULB_COLORS.length]!, delay: (k % 4) * 0.6 };
});

export const Garland: FC = () => (
  <div aria-hidden="true" className="absolute top-0 left-0 w-full h-[108px] pointer-events-none">
    <svg width={WIDTH} height={108} viewBox={`0 0 ${WIDTH} 108`} className="absolute left-0 top-0">
      <path d={WIRE_PATH} fill="none" strokeWidth={3.6} className="stroke-mist/30" />
    </svg>
    {BULBS.map((bulb, k) => (
      <span
        key={k}
        className={`absolute animate-twinkle ${bulb.color}`}
        style={{ left: bulb.x - 8, top: bulb.y - 2, animationDelay: `${bulb.delay}s` }}
      >
        <span className="block mx-auto h-[7px] w-[8px] rounded-t-sm bg-mist/60" />
        <span className="block h-[22px] w-[16px] rounded-b-full rounded-t-[8px] bg-current shadow-[0_0_17px_5px_currentColor]" />
      </span>
    ))}
  </div>
);
