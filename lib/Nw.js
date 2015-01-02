require('./log');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var phantomJsPath = require('phantomjs').path;
var Nightwatch = require('nightwatch/lib/index.js');

var Nw = function (configPath, testSettings, cliOptions) {
	log.debug('Nw.constructor()');

	var self = this;
	this.configPath = configPath;
	this.cliOptions = cliOptions || {};

	this.nightwatch = false;
	this.testSettings = testSettings || {};
};

util.inherits(Nw, EventEmitter);

_.extend(Nw.prototype, {
	start: function () {
		log.debug('Nw.start()');

		this.nightwatch = Nightwatch.runner(
			this.getCommandLineOptions(),
			this.getTestsCompleteCallback(),
			this.getSettings()
		);
	},

	getCommandLineOptions: function () {
		log.debug('Nw.getCommandLineOptions()');
		var self = this;

		// force config path
		self.cliOptions['config'] = self.configPath;

		// suggest default environment
		_.defaults(self.cliOptions, {
			env: 'default'
		});

		return self.cliOptions;
	},

	getTestsCompleteCallback: function () {
		log.debug('Nw.getTestsCompleteCallback()');

		var self = this;
		return function (result) {
			// result is true, if all tests ran and 
			// no tests failed and no error occured

			log.debug('Nw.onTestsComplete.result', result);

			self.emit('completed', result);
		};
	},

	// overrides test_settings(.default) in nightwatch.json (specified in commandLineOptions.config)
	getSettings: function () {
		log.debug('Nw.getSettings()');

		return _.extend({
			"desiredCapabilities": {
				"browserName" : "phantomjs",
				"javascriptEnabled" : true,
				"acceptSslCerts" : true,
				"phantomjs.binary.path" : phantomJsPath
			}
		}, this.testSettings);
	}
});

module.exports = Nw;