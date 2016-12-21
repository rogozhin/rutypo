const symbols = require('./symbols');
const nbsp = symbols['non-breaking space'].utf;
const joiner = symbols['word joiner'].utf;
const endash = symbols['en dash'].utf;
const emdash = symbols['em dash'].utf;
const quot = {
	ru: [
		symbols['left-pointing double angle quotation mark'].utf,
		symbols['right-pointing double angle quotation mark'].utf,
		symbols['double low-9 quotation mark'].utf,
		symbols['left double quotation mark'].utf
	],
	en: [
		symbols['left double quotation mark'].utf,
		symbols['right double quotation mark'].utf,
		symbols['left single quotation mark'].utf,
		symbols['right single quotation mark'].utf
	]
}

const processes = {};

function getSymbolVariants(symbol) {
	const result = [];
	if (symbol.utf) {
		result.push(symbol.utf);
	}

	if (symbol.entity) {
		result.push(symbol.entity);
	}

	if (Array.isArray(symbol.syn)) {
		result.push(...symbol.syn);
	}

	return result;
}

function getGroup(group) {
	const list = [];

	Object.keys(symbols)
		.filter(symbol => symbols[symbol].group === group)
		.forEach(symbol => list.push(...getSymbolVariants(symbols[symbol])));

	return list;
}

function convertGroup(text, group, replace) {
	const list = getGroup(group);
	const reg = new RegExp(list.join('|', 'g'));

	return text.replace(reg, replace);
}

processes.cleanSpaces = (text) => {
	const result = text
		.replace(/\r/g, '\n')
		.replace(/[ ]+\n|\n[ ]+/gm, '\n')
		.replace(/[ \t]{2,}/g, ' ');

	return result;
};

// define converters
[
	['quot', '"'], ['space', ' '], ['hidden', ''], ['dash', '-'], ['numero', '№']
].forEach((symbol) => {
	const code = symbol[0].charAt(0).toUpperCase() + symbol[0].substr(1);

	processes.convert = {};
	processes.convert[code] = (text) => {
		return convertGroup(text, symbol[0], symbol[1]);
	};
});

processes.typoNumero = (text) => text.replace(/№ *([\wа-я\d])/gi, `№${nbsp}$1`);

processes.typoAbbr = (text) => {
	return text
		.replace(/(\s)т\. (д|п)\./g, `$1т.${nbsp}$2.`)
		.replace(/([^а-я])(см\.|им\.|рис\.|ср.)\s+/ig, `$1$2${nbsp}`)
		.replace(/([^а-я]|^)([а-я])[\/\\]([а-я])([^а-я]|$)/gi, `$1$2${joiner}/${joiner}$3$4`);
};

processes.typoNames = (text) => {
	return text
		.replace(/(\s|^)([A-ZА-Я]\.)\s*([A-ZА-Я]\.)\s*([A-ZА-Я][A-ZА-Яa-zа-я-]+)/g, `$1$2$3${nbsp}$4`)
		.replace(/(\s|^)([A-ZА-Я]\.)\s*([A-ZА-Я][A-ZА-Яa-zа-я-]+)/g, `$1$2${nbsp}$3`)
		.replace(/(\s|^)([A-ZА-Я][A-ZА-Яa-zа-я-]+)\s*([A-ZА-Я]\.)\s*([A-ZА-Я]\.)/g, `$1$2${nbsp}$3$4`)
		.replace(/(\s|^)([A-ZА-Я][A-ZА-Яa-zа-я-]+)\s*([A-ZА-Я]\.)/g, `$1$2${nbsp}$3`);
};

processes.typoDashes = (text) => {
	return text
		.replace(/--/g, `${emdash}`)
		.replace(/ -(\s|$)/g, `${nbsp}${emdash}$1`)
		.replace(/^-(\s|$)/g, `${emdash}$1`)
		.replace(/([\wа-я]+)-((?:то|за|под)[^а-я])/gi, `$1${joiner}-${joiner}$2`)
		.replace(/((?:[^а-я]|^)[\wа-я]{1,2})-([\wа-я]+)/gi, `$1${joiner}-${joiner}$2`)
		.replace(/([\wа-я]+)-([\wа-я]{1,2}(?:(?:[^а-я]|$)))/gi, `$1${joiner}-${joiner}$2`);
};

processes.typoShortWords = (text) => {
	return text
		.replace(/\s+(бы|б|же|ли)([^а-я])/gi, `${nbsp}$1$2`)
		.replace(/(^|\s|&#?[0-9a-z]+;|\()((?!бы|б|же|ли)[\wа-я]{1,2})\s+/gi, `$1$2${nbsp}`)
		.replace(/\s([\wа-я]{1,2}[.!?;,])$/gi, `${nbsp}$1`)
		.replace(/\u00a0 +| +\u00a0/g, nbsp);
};

processes.typoNumbers = (text) => {
	const phoneReg = /(?:\(?(?:\+7|8)\s+)?\(?(?:\d{2,}[\d -]{0,3}\d\)?\s+)?\d[\d -]{3,7}\d/;

	return text
		.replace(phoneReg, phone => phone.split(/\b/).join(joiner).replace(/ /g, nbsp))
		.replace(/(\d[\d,.]*)-(\d[\d,.]*)/g, `$1${joiner}${endash}${joiner}$2`)
		.replace(/(\d+)-([\d\wа-я]+)/gi, `$1${joiner}-${joiner}$2`)
		.replace(/(\d) +(?!и[^а-я])/gi, `$1${nbsp}`)
		.replace(/(\d) (\d)/g, `$1${nbsp}$2`);
};

processes.typoQuot = (text) => {
	return text
		.replace(/(^|[^а-я])("{1,2})([а-я])/gi, (m, space, quotes, letter) => {
			const newQuotes = quotes.length === 2 ? quot.ru[0] + quot.ru[2] : quot.ru[0];
			return `${space}${newQuotes}${letter}`;
		})
		.replace(/([а-я])("{1,2})([^а-я]|$)"?/gi, (m, letter, quotes, space) => {
			const newQuotes = quotes.length === 2 ? quot.ru[3] + quot.ru[1] : quot.ru[1];
			return `${letter}${newQuotes}${space}`;
		})
		.replace(/(^|[^a-z])("{1,2})([a-z])/gi, (m, space, quotes, letter) => {
			const newQuotes = quotes.length === 2 ? quot.en[0] + quot.en[2] : quot.en[0];
			return `${space}${newQuotes}${letter}`;
		})
		.replace(/([a-z])("{1,2})([^a-z]|$)"?/gi, (m, letter, quotes, space) => {
			const newQuotes = quotes.length === 2 ? quot.en[3] + quot.en[1] : quot.en[1];
			return `${letter}${newQuotes}${space}`;
		})
		.replace(/(«[^«»]+)«/g, `$1${quot.ru[2]}`)
		.replace(/(“[^“”]+)“/g, `$1${quot.en[2]}`)
		.replace(/»([^«»]+»)/g, `${quot.ru[3]}$1`)
		.replace(/”([^“”]+”)/g, `${quot.en[3]}$1`)
		.replace(/(«[^»]+)"([^»]*)$/gi, `$1${quot.ru[1]}$2`)
		.replace(/^([^«]*)"([^«]+»)/gi, `$1${quot.ru[0]}$2`)
		.replace(/(“[^”]+)"([^”]*)$/gi, `$1${quot.en[1]}$2`)
		.replace(/^([^“]*)"([^“]+”)/gi, `$1${quot.en[0]}$2`);
};

processes.convertEntity = (text, group) => {
	let result = text;
	Object.keys(symbols)
		.filter(symbol => symbols[symbol].group === group && symbols[symbol].entity)
		.forEach((code) => {
			const symbol = symbols[code];
			result = result.replace(new RegExp(symbol.utf, 'g'), symbol.entity);
		});

	return result;
};

module.exports = processes;
