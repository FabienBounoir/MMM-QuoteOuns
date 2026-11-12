/* Logique pure, partagée par node_helper.js et test.js */

// Les citations sources finissent parfois par « @ -Auteur »
function splitAuthor(raw) {
	const [text, author] = String(raw ?? "").split(/\s*@\s*-\s*/);
	return { text: text.trim(), author: author?.trim() || null };
}

// Fusionne les lots reçus de l'API, sans doublons (texte comparé sans casse ni espaces multiples)
function mergeQuotes(batches) {
	const seen = new Set();
	const quotes = [];
	for (const batch of batches) {
		for (const item of batch ?? []) {
			const quote = splitAuthor(item?.text);
			const key = quote.text.toLowerCase().replace(/\s+/g, " ");
			if (!quote.text || seen.has(key)) continue;
			seen.add(key);
			quotes.push(quote);
		}
	}
	return quotes;
}

// Disposition selon la région MagicMirror : alignement, taille du texte, longueur max par défaut
const LAYOUTS = {
	fullscreen_above: { layout: "full", size: "xlarge", maxLength: 220 },
	fullscreen_below: { layout: "full", size: "xlarge", maxLength: 220 },
	top_bar: { layout: "bar", size: "large", maxLength: 180 },
	bottom_bar: { layout: "bar", size: "large", maxLength: 180 },
	upper_third: { layout: "center", size: "large", maxLength: 140 },
	middle_center: { layout: "center", size: "large", maxLength: 140 },
	lower_third: { layout: "center", size: "large", maxLength: 140 },
	top_center: { layout: "center", size: "medium", maxLength: 120 },
	bottom_center: { layout: "center", size: "medium", maxLength: 120 },
	top_left: { layout: "left", size: "medium", maxLength: 100 },
	bottom_left: { layout: "left", size: "medium", maxLength: 100 },
	top_right: { layout: "right", size: "medium", maxLength: 100 },
	bottom_right: { layout: "right", size: "medium", maxLength: 100 }
};

function layoutFor(position, config = {}) {
	const base = LAYOUTS[position] ?? LAYOUTS.middle_center;
	return {
		layout: base.layout,
		size: config.size && config.size !== "auto" ? config.size : base.size,
		maxLength: Number.isInteger(config.maxLength) ? config.maxLength : base.maxLength
	};
}

function buildUrl(apiUrl, { lang, category, maxLength, count = 10 }) {
	const url = new URL(apiUrl);
	url.searchParams.set("lang", lang);
	url.searchParams.set("category", category);
	url.searchParams.set("maxLength", String(maxLength));
	url.searchParams.set("count", String(count));
	return url.toString();
}

// Tire une citation au hasard, différente de la précédente quand c'est possible
function pickNext(quotes, previous, random = Math.random) {
	if (!quotes.length) return null;
	const pool = quotes.length > 1 ? quotes.filter((q) => q.text !== previous?.text) : quotes;
	return pool[Math.floor(random() * pool.length)];
}

module.exports = { splitAuthor, mergeQuotes, layoutFor, buildUrl, pickNext, LAYOUTS };
