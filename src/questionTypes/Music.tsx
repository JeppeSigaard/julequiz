import vinylStop from "../sfx/vinyl-stop.mp3";

export const MusicBody = () => (
  <>
    <p className="text-7xl">MUSIKQUIZ!</p>
    <audio src={vinylStop} autoPlay />
  </>
);
