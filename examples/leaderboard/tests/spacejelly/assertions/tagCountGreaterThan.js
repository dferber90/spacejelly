// Custom assertions. See http://nightwatchjs.org/guide#custom-assertions

// Example based on Slide 70 of http://de.slideshare.net/sethmcl/join-the-darkside-nightwatchjs
// There was a change in the Nightwatch API, so example was changed a bit.

// Up-to-date examples, see https://github.com/beatfactor/nightwatch/blob/master/lib/api/assertions/



var util = require('util');

exports.assertion = function (tagName, minCount, msg) {

	var defaultMessage = 'Testing if there are more than %s <%s> elements on the page.';
	var errorMessage = 'Error executing command';

	// Set default message
	this.message = msg || util.format(defaultMessage, minCount, tagName);

	// The expected text
	this.expected = function () {
		return minCount + 1;
	};

	// returning true means assertion passed
	// returning false means assertion failed
	this.pass = function (value) {
		return value > minCount;
	};

	// returning true means element could not be found
	this.failure = function (result) {
		var failed = (result === false || (result && result.status === -1));

		if (failed) {
			this.message = msg || errorMessage;
		}

		return failed;
	};

	this.value = function (result) {
		var value = null;
		if (result.status === 0) {
			value = result.value.length;
		}
		return value;
	};

	this.command = function (callback) {


		// Selenium commands, see: http://nightwatchjs.org/api#protocol
		// make sure to follow See: "/session/.." links, to learn about
		// the provided responses.
		this.api.elements(
			this.client.locateStrategy,
			tagName,
			callback
		);

		return this;
	};
};
