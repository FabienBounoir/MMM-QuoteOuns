// node test.js : vérifie la logique de quotes.js
const assert = require("node:assert/strict");
const { splitAuthor, mergeQuotes, layoutFor, buildUrl, pickNext, LAYOUTS } = require("./quotes");

assert.deepEqual(splitAuthor("Crois en toi. @ -Emma Watson"), { text: "Crois en toi.", author: "Emma Watson" });
assert.deepEqual(splitAuthor("Sans auteur."), { text: "Sans auteur.", author: null });

const merged = mergeQuotes([
	[{ text: "Foncez." }, { text: "Rêve grand. @ -Moi" }],
	[{ text: "foncez." }, { text: "" }, null],
	undefined
]);
assert.equal(merged.length, 2);
assert.equal(merged[1].author, "Moi");

assert.deepEqual(layoutFor("top_left"), { layout: "left", size: "medium", maxLength: 100 });
assert.deepEqual(layoutFor("fullscreen_above", { size: "large", maxLength: 300 }), { layout: "full", size: "large", maxLength: 300 });
assert.equal(layoutFor("inconnue").layout, "center");

// Le front (MMM-QuoteOuns.js) recopie ce tableau : les deux doivent rester identiques
const front = require("node:fs").readFileSync(require("node:path").join(__dirname, "MMM-QuoteOuns.js"), "utf-8");
for (const [position, { layout, size, maxLength }] of Object.entries(LAYOUTS)) {
	assert.ok(front.includes(`${position}: ["${layout}", "${size}", ${maxLength}]`), `layout désynchronisé : ${position}`);
}

const url = new URL(buildUrl("https://quote-ouns.vercel.app/api/quotes/random", { lang: "fr", category: "life", maxLength: 90 }));
assert.equal(url.searchParams.get("category"), "life");
assert.equal(url.searchParams.get("count"), "10");

const quotes = [{ text: "A" }, { text: "B" }];
assert.equal(pickNext(quotes, { text: "A" }, () => 0).text, "B");
assert.equal(pickNext([{ text: "A" }], { text: "A" }).text, "A");
assert.equal(pickNext([], null), null);

console.log("MMM-QuoteOuns : OK");
