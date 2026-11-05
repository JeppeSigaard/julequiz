import { FunctionComponent, useEffect, useRef, useState } from "react";

import mmlemSFX from "../sfx/yoshi-tongue.mp3";
import { asset } from "../asset";
import { cachedUrl, useCachedUrl } from "../mediaCache";

const getCatimgSrc = (images: string[]) => {
  const path = images[Math.floor(Math.random() * images.length)];
  return path === undefined ? undefined : cachedUrl(asset(path));
};

export const GuessThatCat: FunctionComponent<{
  images: string[];
  from: number;
  to: number;
  className?: string;
}> = (props) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [visible, show] = useState(false);
  const mmlem = useCachedUrl(mmlemSFX);
  const [catSrc, setCatSrc] = useState(() => getCatimgSrc(props.images));

  useEffect(() => {
    const delay =
      Math.floor(Math.random() * (props.to - props.from + 1)) + props.from;
    timerRef.current = setTimeout(() => {
      setCatSrc(getCatimgSrc(props.images));
      show(true);
    }, delay);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!visible) {
    return <p className="font-display text-[58px] text-ink-soft">borte, borte, borte...</p>;
  }

  return (
    <>
      <div className="rotate-2 bg-paper-lit p-4 pb-8 shadow-paper-edge rounded-[8px]">
        <img src={catSrc} alt="A cute cat" className={props.className} />
      </div>
      {visible && <audio src={mmlem} autoPlay />}
    </>
  );
};
