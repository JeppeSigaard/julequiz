const NUM = String.raw`(?<!\d)(\d{1,3}(?:[. ]\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)`
const BEFORE_WORD = String.raw`(\s*(?:kr(?![a-zæøå])|kroner|dkk|,-|;-|:-))`
const PRICE_WORD =
	String.raw`(?<![a-zæøå])(?:kroner|kr\.?|dkk|prisen|pris|nyprisen|nypris|butikspris|vejl\.|koster|sælges for|bud)` +
	String.raw`(?![a-zæøå])\s*[:=]?\s*(?:(?:er|på|fra|ca\.|ca|kun)\s+)?`

export function clean(text) {
	return text.replace(/\s+/g, ' ').trim()
}

export function maskPrices(text, priceKroner) {
	const numberBeforeWord = new RegExp(NUM + BEFORE_WORD, 'gi')
	const numberAfterWord = new RegExp('(' + PRICE_WORD + ')' + NUM, 'gi')
	const anyNumber = new RegExp(NUM, 'g')
	return text
		.replace(numberBeforeWord, (_match, _num, word) => 'X' + word)
		.replace(numberAfterWord, (_match, prefix) => prefix + 'X')
		.replace(anyNumber, (match) => {
			const value = match.replace(/[. ]/g, '').replace(/,00?$/, '')
			return value === String(priceKroner) ? 'X' : match
		})
}

export function truncate(text, max) {
	if (text.length <= max) {
		return text
	}
	let cut = text.slice(0, max - 1)
	const lastSpace = cut.lastIndexOf(' ')
	if (lastSpace > 0) {
		cut = cut.slice(0, lastSpace)
	}
	return cut.replace(/[\s,.;:!–-]+$/, '') + '…'
}
