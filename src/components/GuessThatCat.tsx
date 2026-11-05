import { FunctionComponent, useEffect, useRef, useState } from "react";

import mmlemSFX from "../sfx/yoshi-tongue.mp3";
import { asset } from "../asset";

const IMG_SOURCES = [
  asset("/images/babybox-hero.png"),
  asset("/images/cakey-hero2.png"),
  asset("/images/carlita-hero.png"),
  asset("/images/catrat-hero3.png"),
  asset("/images/djcatnip-hero2.png"),
  asset("/images/kittyfairy-hero.png"),
  asset("/images/mercat-hero3.png"),
  asset("/images/pandy-hero2.png"),
  asset("/images/pillowcat-hero.png"),
];

const getCatimgSrc = () => {
  return IMG_SOURCES[Math.floor(Math.random() * IMG_SOURCES.length)];
};

export const GuessThatCat: FunctionComponent<{
  from: number;
  to: number;
  className?: string;
}> = (props) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [visible, show] = useState(false);
  const [catSrc, setCatSrc] = useState(() => getCatimgSrc());

  useEffect(() => {
    const delay =
      Math.floor(Math.random() * (props.to - props.from + 1)) + props.from;
    timerRef.current = setTimeout(() => {
      setCatSrc(getCatimgSrc());
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
