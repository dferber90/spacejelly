var expect = require("chai").expect;

module.exports = function (url, port) {

	expect(url).to.be.a('string').and.to.be.ok;

	if (port) {
		expect(port).to.match(/^[0-9]+$/);
	}

	var urlWithPort;

	// remove trailing slash
	if (url.slice(-1) === '/') {
		url = url.slice(0, -1);
	}

	// combine url and port
	if (port) {
		urlWithPort = url + ':' + port;
	} else {
		urlWithPort = url;
	}

	// add trailing slash
	urlWithPort = urlWithPort + '/';

	return urlWithPort;
};