'use strict';

const debug = require('debug')('ads');
const Promise = require('bluebird');
const glob = Promise.promisify(require('glob'));
const fs = require('fs');
const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);
const path = require('path');
const cheerio = require('cheerio');
const minifyHtml = require('html-minifier').minify;
const source = 'src';
const destination = 'dest';
const styleReg = /<!--\s*style\s+([\w\d._-]+).css\s*-->/;
const scriptReg = /<!--\s*script\s+([\w\d._-]+).js\s*-->/;

let ADS = {};
let CSS = {};
let JS = {};

function fileContent(file) {
	return readFile(file, 'utf8');
}

function formatContent(content, reg, files, prefix, sufix) {
	var result;
	while ((result = reg.exec(content)) !== null) {
		var match = result[0];
		var filename = result[1];
		var file = files[filename];
		debug('replace filename ' + filename);
		if (!file) {
			throw new Error('Nor found file ' + filename);
		}
		content = content.replace(match, prefix + file + sufix);
	}

	return content;
}

function initVar(container, src, ext) {
	return glob(source + src)
		.each(function(file) {
			return fileContent(file)
				.then(content => {
					var filename = path.basename(file, ext);
					container[filename] = content;
				});
		});
}

function initAds() {
	return initVar(ADS, '/ads/*.html', '.html');
}

function initCss() {
	return initVar(CSS, '/css/*.css', '.css');
}

function initJs() {
	return initVar(JS, '/js/*.js', '.js');
}

function init() {
	return Promise.all([initAds(), initCss(), initJs()]);
}

function formatAdsContent() {
	return Promise.each(Object.keys(ADS), function(name) {
		var content = ADS[name];
		content = formatContent(content, styleReg, CSS, '<style>', '</style>');
		content = formatContent(content, scriptReg, JS, '<script>', '</script>');
		ADS[name] = minifyHtml(content, { minifyCSS: true, minifyJS: true, collapseWhitespace: true });
	});
}

function formatAdsScript() {
	return Promise.map(Object.keys(ADS), function(name) {
		var $ = cheerio.load(ADS[name]);
		var item = { html: ADS[name], name: name };
		$('meta').each(function() {
			var metaName = $(this).attr('name');
			debug('meta name: ' + metaName);
			item[metaName] = $(this).attr('content').split(/[;, ]+/g);
		});

		return item;
	}).then(ads => {
		return ['<script>window.Ads=', JSON.stringify(ads), ';</script>'].join('');
	});
}

function formatIndex(adsScript) {
	return fileContent(source + '/index.html')
		.then(function(content) {
			content = formatContent(content, styleReg, CSS, '<style>', '</style>');
			content = formatContent(content, scriptReg, JS, '<script>', '</script>');
			content = content.replace(/<!--\s*ads\s*-->/, adsScript);
			return minifyHtml(content, { minifyCSS: true, minifyJS: true, collapseWhitespace: true });
		});
}

function saveIndex(content) {
	return writeFile(path.join(__dirname, destination, 'index.html'), content, 'utf8');
}

function build() {
	return init()
		.then(formatAdsContent)
		.then(formatAdsScript)
		.then(formatIndex)
		.then(saveIndex);
}

build();
