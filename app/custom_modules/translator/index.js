'use strict';

var path = require('path');
const { remote } = require('electron');

function Translator() {
	var langs = {
		ko: 'ko'
	};
	var lang = remote.getCurrentWindow().curLang;
	lang = langs[lang];
	if(lang == undefined)
		lang = 'en';
	this.lang = lang;

	var Localize = require('../localize');
	var loc = new Localize(__dirname);
	this.loc = loc;
	loc.setLocale(lang);
	loc.throwOnMissingTranslation(false);
}

Translator.prototype.getLanguage = function() {
	return this.lang;
};

Translator.prototype.translate = function(str) {
	if(this.loc) {
		return this.loc.translate(str);
	}
};

module.exports = new Translator();