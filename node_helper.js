const NodeHelper = require("node_helper");
const Log = require("logger");
const fs = require("node:fs");
const path = require("node:path");
const { mergeQuotes, buildUrl } = require("./quotes");

// Dernières citations reçues, gardées sur disque : le module affiche quelque chose même sans internet au démarrage
const CACHE_FILE = path.join(__dirname, "cache.json");

module.exports = NodeHelper.create({
	start() {
		this.timers = {};
		try {
			this.cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
		} catch {
			this.cache = {};
		}
	},

	socketNotificationReceived(notification, payload) {
		if (notification !== "QUOTEOUNS_START") return;
		const { id, config } = payload;
		const key = JSON.stringify([config.lang, config.categories, config.maxLength]);

		if (this.cache[key]?.length) this.send(id, this.cache[key]);

		const refresh = () => this.refresh(id, key, config);
		refresh();
		clearInterval(this.timers[id]);
		this.timers[id] = setInterval(refresh, config.fetchInterval);
	},

	async refresh(id, key, config) {
		const batches = await Promise.all(
			config.categories.map(async (category) => {
				try {
					const res = await fetch(buildUrl(config.apiUrl, { ...config, category }), {
						signal: AbortSignal.timeout(15000)
					});
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					return (await res.json()).data;
				} catch (error) {
					Log.warn(`[MMM-QuoteOuns] ${category}: ${error.message}`);
					return [];
				}
			})
		);

		const quotes = mergeQuotes(batches);
		if (!quotes.length) {
			// Hors ligne ou API muette : on garde ce qui est déjà affiché
			Log.warn("[MMM-QuoteOuns] aucune citation reçue, les précédentes sont conservées");
			return;
		}

		this.cache[key] = quotes;
		fs.writeFile(CACHE_FILE, JSON.stringify(this.cache), (error) => {
			if (error) Log.warn(`[MMM-QuoteOuns] cache non écrit : ${error.message}`);
		});
		this.send(id, quotes);
	},

	send(id, quotes) {
		this.sendSocketNotification("QUOTEOUNS_QUOTES", { id, quotes });
	}
});
