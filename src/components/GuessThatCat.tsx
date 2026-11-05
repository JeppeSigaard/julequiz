import { FunctionComponent, useEffect, useRef, useState } from "react";

import mmlemSFX from "../sfx/yoshi-tongue.mp3";
import { asset } from "../asset";

const getCatimgSrc = (images: string[]) => {
  const path = images[Math.floor(Math.random() * images.length)];
  return path === undefined ? undefined : asset(path);
};

export const GuessThatCat: FunctionComponent<{
  images: string[];
  from: number;
  to: number;
  className?: string;
}> = (props) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [visible, show] = useState(false);
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
    return <p className="text-3xl">borte, borte, borte...</p>;
  }

  return (
    <>
      <img src={catSrc} alt="A cute cat" className={props.className} />
      {visible && <audio src={mmlemSFX} autoPlay />}
    </>
  );
};
