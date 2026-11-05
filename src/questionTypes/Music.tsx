import { FunctionComponent } from "react";

import { MusicBox } from "../components/MusicBox";
import { useCachedUrl } from "../mediaCache";
import vinylStop from "../sfx/vinyl-stop.mp3";

export const MusicBody: FunctionComponent<{
  track: string;
  start: number;
  stop: number;
}> = (props) => {
  const vinyl = useCachedUrl(vinylStop);
  return (
    <>
      <p className="font-display text-[110px] font-bold leading-none text-accent-deep">MUSIKQUIZ!</p>
      <audio src={vinyl} autoPlay />
      <MusicBox track={props.track} start={props.start} stop={props.stop} />
    </>
  );
};
