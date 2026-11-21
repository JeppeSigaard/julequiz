const NUM =
  String.raw`(?<!\d)(?:\d{1,3}(?:[. ]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?!\d)`;
const RANGE_SEP = String.raw`(\s*(?:-|–|\/|til|og)\s*)`;
const RANGE_NUM = NUM + "(?:" + RANGE_SEP + NUM + ")?";
// JS \b kender ikke æøå, så kr kræver et lookahead i stedet
const BEFORE_WORD = String.raw`(\s*(?:kr(?![a-zæøå])|kroner|krone|dkk|\.-|,-|;-|:-))`;
const PRICE_WORD =
  String.raw`(?:(?<![a-zæøå])(?:kroner|krone|kr\.?|dkk|bud|byd|værdi|vejl\.|koster|` +
  String.raw`sælges for|sælges til|købt for|solgt for)|[a-zæøå]*pris(?:en)?)` +
  String.raw`(?![a-zæøå])\s*[:=]?\s*` +
  String.raw`(?:(?:er|på|fra|ca\.|ca|kun|var|til|over|pr\.|stk\.|normalt)\s+){0,3}`;

export function clean(text) {
  return text
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function maskPrices(text, priceKroner) {
  const numberBeforeWord = new RegExp(RANGE_NUM + BEFORE_WORD, "gi");
  const numberAfterWord = new RegExp("(" + PRICE_WORD + ")" + RANGE_NUM, "gi");
  const anyNumber = new RegExp(NUM, "g");
  return text
    .replace(numberBeforeWord, (_match, sep, word) => "X" + (sep ? sep + "X" : "") + word)
    .replace(numberAfterWord, (_match, prefix, sep) => prefix + "X" + (sep ? sep + "X" : ""))
    .replace(anyNumber, (match) => {
      const decimal = match.match(/[.,](\d{1,2})$/);
      if (decimal && Number(decimal[1]) !== 0) {
        return match;
      }
      const whole = decimal ? match.slice(0, -decimal[0].length) : match;
      return whole.replace(/[. ]/g, "") === String(priceKroner) ? "X" : match;
    });
}

export function truncate(text, max) {
  const chars = Array.from(text);
  if (chars.length <= max) {
    return text;
  }
  let cut = chars.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > 0) {
    cut = cut.slice(0, lastSpace);
  }
  return cut.join("").replace(/[\s,.;:!–-]+$/, "") + "…";
}
