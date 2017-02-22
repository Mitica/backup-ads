'use strict';

const glob = require('glob');
const Promise = require('bluebird');
const fs = require('fs');

function fileContent(file) {
	return new Promise(function(reject, resolve) {
		fs.readFile(file, 'utf8', (error, content) => {
			if (error) {
				return reject(error);
			}
			resolve(content);
		});
	});
}
