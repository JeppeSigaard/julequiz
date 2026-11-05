import { FunctionComponent } from "react";

import { MusicBox } from "../components/MusicBox";
import vinylStop from "../sfx/vinyl-stop.mp3";

export const MusicBody: FunctionComponent<{
  track: string;
  start: number;
  stop: number;
}> = (props) => (
  <>
    <p className="font-display text-[110px] font-bold leading-none text-accent-deep">MUSIKQUIZ!</p>
    <audio src={vinylStop} autoPlay />
    <MusicBox track={props.track} start={props.start} stop={props.stop} />
  </>
);
