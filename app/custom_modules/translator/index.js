'use strict';

function Translator() {
	const langs = {
		ko: 'ko',
	};
	let lang = window.navigator.userLanguage || window.navigator.language;
	lang = langs[lang];
	if (lang === undefined) {
		lang = 'en';
	}
	this.lang = lang;

	const Localize = require('./localize');
	const loc = new Localize(__dirname);
	this.loc = loc;
	loc.setLocale(lang);
	loc.throwOnMissingTranslation(false);
}

Translator.prototype.getLanguage = function() {
	return this.lang;
};

Translator.prototype.translate = function(str) {
	if (this.loc) {
		return this.loc.translate(str);
	}
};

module.exports = new Translator();
