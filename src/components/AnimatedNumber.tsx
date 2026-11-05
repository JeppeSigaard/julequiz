import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

export function AnimatedNumber({
  value,
  duration = 1200,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  // Den viste værdi, opdateret i hver frame, så en ny animation starter hvor den forrige nåede til
  const shownValue = useRef(value);

  useEffect(() => {
    const startValue = shownValue.current;
    const endValue = value;
    if (startValue === endValue) return;
    const startTime = performance.now();
    let frameId = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = Math.round(startValue + (endValue - startValue) * eased);
      shownValue.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span>{displayValue < 0 ? `−${-displayValue}` : displayValue}</span>;
}
