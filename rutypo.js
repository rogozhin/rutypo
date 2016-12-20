const process = require('./process');
const entGroups = ['space', 'hidden', 'quot', 'dash'];

function typo(text, params = {}) {
	let result = text;

	Object.keys(process.convert)
		.forEach((convert) => {
			result = process.convert[convert](result);
		});

	result = process.cleanSpaces(result);

	result = process.typoNumero(result);
	result = process.typoAbbr(result);
	result = process.typoNames(result);
	result = process.typoDashes(result);
	result = process.typoShortWords(result);
	result = process.typoNumbers(result);
	result = process.typoQuot(result);

	if (params.entity) {
		let entities = Array.isArray(params.entity) ? params.entity : [params.entity];
		if (params.entity === 'all') {
			entities = [...entGroups];
		}
		if (params.entity === 'special') {
			entities = ['space', 'hidden'];
		}

		entities.forEach((group) => {
			result = process.convertEntity(result, group);
		});
	}

	return result;
}

module.exports = typo;
