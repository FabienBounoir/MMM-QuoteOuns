/* global Module */

Module.register("MMM-QuoteOuns", {
	defaults: {
		apiUrl: "https://quote-ouns.vercel.app/api/quotes/random",
		lang: "fr",
		categories: ["motivation", "positivity", "happy", "life", "short-quotes"],
		maxLength: "auto", // nombre de caractères, ou "auto" selon la position
		size: "auto", // "auto", "xsmall", "small", "medium", "large", "xlarge"
		showAuthor: true,
		rotateInterval: 30 * 1000,
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
		if (first) {
			this.next();
			this.startRotation();
		}
	},

	startRotation() {
		clearInterval(this.timer);
		this.timer = setInterval(() => this.next(), this.config.rotateInterval);
	},

	next() {
		const pool = this.quotes.length > 1 ? this.quotes.filter((q) => q.text !== this.current?.text) : this.quotes;
		this.current = pool[Math.floor(Math.random() * pool.length)] ?? null;
		this.updateDom(this.config.fadeSpeed);
	},

	suspend() {
		clearInterval(this.timer);
	},

	resume() {
		if (this.quotes.length) this.startRotation();
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = `quoteouns qo-${this.layout}`;
		if (!this.current) return wrapper;

		const text = document.createElement("div");
		text.className = `qo-text bright thin ${this.sizeClass}`;
		text.textContent = this.current.text;
		wrapper.appendChild(text);

		if (this.config.showAuthor && this.current.author) {
			const author = document.createElement("div");
			author.className = "qo-author bright regular medium";
			author.textContent = `— ${this.current.author}`;
			wrapper.appendChild(author);
		}
		return wrapper;
	}
});
