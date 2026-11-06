import { useAsset } from "../mediaCache";

const titleSize = (text: string) =>
  text.length <= 20 ? "text-[64px]" : text.length <= 44 ? "text-[52px]" : "text-[44px]";

const descriptionSize = (text: string) =>
  text.length <= 60 ? "text-[36px]" : text.length <= 140 ? "text-[30px]" : "text-[26px]";

const priceSize = (text: string) =>
  text.length <= 11 ? "text-[80px]" : text.length <= 16 ? "text-[64px]" : "text-[52px]";

export const PriceListing = ({
  image,
  title,
  description,
  price,
}: {
  image: string;
  title: string;
  description: string;
  price?: string;
}) => {
  const src = useAsset(image);

  return (
    <article className="relative mb-11 grid w-[1200px] grid-cols-[520px_minmax(0,1fr)] gap-[56px] rounded-[28px] bg-paper-lit p-9 text-left shadow-[0_8px_0_color-mix(in_oklab,var(--quiz-paper)_80%,black)]">
      <div className="absolute -left-[44px] -top-[30px] z-10 -rotate-7 whitespace-nowrap rounded-[14px] bg-accent px-10 pt-2 pb-[14px] font-display text-[58px] font-bold leading-none text-paper-lit shadow-[0_6px_0_color-mix(in_oklab,var(--quiz-accent)_72%,black)]">
        Gæt en pris
      </div>
      <img src={src} alt={title} className="block size-[520px] rounded-[18px] object-cover" />
      <div className="flex min-w-0 flex-col gap-6 pt-4">
        <h3 className={`font-body font-black leading-[1.05] text-ink ${titleSize(title)}`}>{title}</h3>
        <p className={`leading-[1.35] text-ink-soft ${descriptionSize(description)}`}>{description}</p>
      </div>
      <div className="absolute -right-10 -bottom-2 -rotate-6">
        {/* clip-path klipper en almindelig box-shadow væk, så skyggen ligger på en wrapper. */}
        <div className="[filter:drop-shadow(0_8px_0_color-mix(in_oklab,var(--quiz-highlight)_72%,black))]">
          <div className="relative flex h-[150px] min-w-[330px] items-center justify-center bg-highlight pl-24 pr-11 [clip-path:polygon(60px_0,100%_0,100%_100%,60px_100%,0_50%)]">
            <div
              aria-hidden
              className="absolute top-3 bottom-3 left-[76px] right-3 rounded-[10px] border-[3px] border-dashed border-ink/30"
            />
            <div
              aria-hidden
              className="absolute left-9 top-[62px] size-[26px] rounded-full bg-paper-lit shadow-[inset_0_3px_0_color-mix(in_oklab,var(--quiz-highlight)_72%,black)]"
            />
            {price === undefined ? (
              <span className="font-display text-[130px] font-bold leading-none whitespace-nowrap text-ink">
                ?
              </span>
            ) : (
              <span
                className={`font-display font-bold leading-none whitespace-nowrap text-ink ${priceSize(price)}`}
              >
                {price}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
