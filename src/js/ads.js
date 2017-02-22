(function(ads, loc, doc) {
	'use strict';
	if (!ads || !ads.length) {
		console.log('no ads');
		return;
	}

	function getQ(name) {
		var query = loc.search.substring(1);
		var vars = query.split('&');
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			if (pair[0] === name) {
				return pair[1];
			}
		}
		return (false);
	}

	function getParams() {
		var params = {
			url: getQ('url'),
			h: getQ('h'),
			w: getQ('w')
		};

		if (params.url) {
			var parser = doc.createElement('a');
			parser.href = params.url;

			params.host = parser.hostname;
			var parts = params.host.split(/\./g);
			if (parts.length > 2) {
				parts.shift();
			}

			params.domain = parts.join('.');
		}

		return params;
	}

	function getAd(params) {
		var oklist = [];

		for (var i = ads.length - 1; i >= 0; i--) {
			var item = ads[i];
			if (item.host) {
				if (~item.host.indexOf(params.host)) {
					oklist.push(item);
				}
			} else if (item.domain) {
				if (~item.domain.indexOf(params.domain)) {
					if (item.noHost) {
						if (item.noHost.indexOf(params.host) < 0) {
							oklist.push(item);
						}
					} else {
						oklist.push(item);
					}
				}
			}
		}

		if (oklist.length === 0) {
			return null;
		}

		var index = Math.floor(Math.random() * oklist.length);

		return oklist[index];
	}

	var params = getParams();

	if (!params || !params.host || !params.domain) {
		console.log('no params', params);
		return;
	}

	var ad = getAd(params);

	if (!ad) {
		console.log('no ad');
		return;
	}

	var url = ad.url[0];
	if (~url.indexOf('?')) {
		url += '&';
	} else {
		url += '?';
	}

	url += ['utm_campaign=backup-ads', 'utm_source=' + params.host, 'utm_content=' + encodeURIComponent(ad.name)].join('&');

	var html = '<a id="ad-link" target="_top" href="' + url + '">' + ad.html + '</a>';

	doc.getElementById('ad').innerHTML = html;

})(window.Ads, window.location, document);
