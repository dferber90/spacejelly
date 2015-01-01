// see http://nightwatchjs.org/guide#custom-commands

exports.command = function (tagName, callback) {
	callback = callback || function () {};

	this.execute(function (tagName) {
		return document.getElementsByTagName(tagName).length;
	}, [tagName], function (result) {
		callback.call(this, result);
	});

	return this;
};