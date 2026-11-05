import vinylStop from "../sfx/vinyl-stop.mp3";

export const MusicBody = () => (
  <>
    <p className="font-display text-[110px] font-bold leading-none text-accent-deep">MUSIKQUIZ!</p>
    <audio src={vinylStop} autoPlay />
  </>
);
