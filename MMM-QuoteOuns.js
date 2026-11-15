/* global Module */

Module.register("MMM-QuoteOuns", {
	defaults: {
		apiUrl: "https://quote-ouns.vercel.app/api/quotes/random",
		lang: "fr",
		categories: ["motivation", "positivity", "happy", "life", "short-quotes"],
		maxLength: "auto", // nombre de caractères, ou "auto" selon la position
		size: "auto", // "auto", "xsmall", "small", "medium", "large", "xlarge"
		showAuthor: true,
		showProgress: false, // barre qui se vide jusqu'à la prochaine citation
		quoteMarks: false, // guillemets autour de la citation, selon la langue (« » en fr, “ ” en en…)
		rotateInterval: 30 * 1000, // ms, ou "auto" : durée selon la longueur de la citation
		fetchInterval: 60 * 60 * 1000,
		fadeSpeed: 2000
	},

	// Mêmes règles que quotes.js (le navigateur ne peut pas faire de require)
	layouts: {
		fullscreen_above: ["full", "xlarge", 220],
		fullscreen_below: ["full", "xlarge", 220],
		top_bar: ["bar", "large", 180],
		bottom_bar: ["bar", "large", 180],
		upper_third: ["center", "large", 140],
		middle_center: ["center", "large", 140],
		lower_third: ["center", "large", 140],
		top_center: ["center", "medium", 120],
		bottom_center: ["center", "medium", 120],
		top_left: ["left", "medium", 100],
		bottom_left: ["left", "medium", 100],
		top_right: ["right", "medium", 100],
		bottom_right: ["right", "medium", 100]
	},

	getStyles() {
		return [this.file("MMM-QuoteOuns.css")];
	},

	start() {
		const [layout, size, maxLength] = this.layouts[this.data.position] ?? this.layouts.middle_center;
		this.layout = layout;
		this.sizeClass = this.config.size === "auto" ? size : this.config.size;
		this.quotes = [];
		this.current = null;

		this.sendSocketNotification("QUOTEOUNS_START", {
			id: this.identifier,
			config: {
				...this.config,
				maxLength: Number.isInteger(this.config.maxLength) ? this.config.maxLength : maxLength
			}
		});
	},

	socketNotificationReceived(notification, payload) {
		if (notification !== "QUOTEOUNS_QUOTES" || payload.id !== this.identifier) return;
		const first = !this.quotes.length;
		this.quotes = payload.quotes;
		if (first) this.next();
	},

	// Depuis un autre module : this.sendNotification("QUOTEOUNS_NEXT")
	notificationReceived(notification) {
		if (notification === "QUOTEOUNS_NEXT" && this.quotes.length) this.next();
	},

	// "auto" : ~60 ms par caractère (temps de lecture large), entre 10 s et 60 s
	durationFor(quote) {
		if (this.config.rotateInterval !== "auto") return this.config.rotateInterval;
		const length = quote.text.length + (quote.author?.length ?? 0);
		return Math.min(60000, Math.max(10000, length * 60));
	},

	next() {
		clearTimeout(this.timer);
		const pool = this.quotes.length > 1 ? this.quotes.filter((q) => q.text !== this.current?.text) : this.quotes;
		this.current = pool[Math.floor(Math.random() * pool.length)] ?? null;
		if (!this.current) return;
		this.duration = this.durationFor(this.current);
		this.updateDom(this.config.fadeSpeed);
		this.timer = setTimeout(() => this.next(), this.duration);
	},

	suspend() {
		clearTimeout(this.timer);
	},

	resume() {
		// Nouvelle citation au retour : la barre repart de zéro, synchro avec le timer
		if (this.quotes.length) this.next();
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = `quoteouns qo-${this.layout}`;
		if (!this.current) return wrapper;

		const text = document.createElement("div");
		text.className = `qo-text bright thin ${this.sizeClass}${this.config.quoteMarks ? " qo-quoted" : ""}`;
		text.lang = this.config.lang; // le navigateur choisit les guillemets de la langue
		text.textContent = this.current.text;
		wrapper.appendChild(text);

		if (this.config.showAuthor && this.current.author) {
			const author = document.createElement("div");
			author.className = "qo-author bright regular medium";
			author.textContent = `— ${this.current.author}`;
			wrapper.appendChild(author);
		}

		if (this.config.showProgress) {
			// ponytail: animation CSS recréée à chaque updateDom, pas de timer JS
			const bar = document.createElement("div");
			bar.className = "qo-progress";
			bar.style.animationDuration = `${this.duration}ms`;
			wrapper.appendChild(bar);
		}
		return wrapper;
	}
});
