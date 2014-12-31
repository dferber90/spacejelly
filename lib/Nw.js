require('./log');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var phantomJsPath = require('phantomjs').path;
var Nightwatch = require('nightwatch/lib/index.js');

var Nw = function (configPath) {
	log.debug('Nw.constructor()');

	var self = this;
	this.configPath = configPath;

	this.nightwatch = false;
};

util.inherits(Nw, EventEmitter);

_.extend(Nw.prototype, {
	start: function () {
		log.debug('Nw.start');

		this.nightwatch = Nightwatch.runner(
			this.getCommandLineOptions(),
			this.getTestsCompleteCallback(),
			this.getSettings()
		);
	},

	getCommandLineOptions: function () {
		return {	
			config: this.configPath, // ./nightwatch.json	The location of the nightwatch.json file - the configuration file which the runner uses and which also includes the Selenium WebDriver options.
			env: 'default', // default	Which testing environment to use - defined in nightwatch.json
			// output: '', // tests_output	The location where the JUnit XML reports will be saved.
			// test: '', // Runs only the specified test. By default it will attempt to run all tests in the folder and its subfolders.
			// group: '', // Runs only the specified group of tests (subfolder). Tests are grouped by being placed in the same subfolder.
			verbose: false, // Shows extended selenium command logging during the session
			skipgroup: false, // Skip one or several (comma separated) group of tests.
			filter: false, // Specify a filter (glob expression) as the file name format to use when loading the test files.
			tags: false, // Filter test modules by tags. Only tests that have the specified tags will be loaded.
			disable_colors: false
		};
	},

	getTestsCompleteCallback: function () {
		var self = this;
		return function (result) {
			// result is true, if all tests ran and 
			// no tests failed and no error occured

			log.debug('Nw.onTestsComplete.result', result);

			self.emit('completed', result);
		};
	},

	// overrides test_settings in nightwatch.json (specified in commandLineOptions.config)
	getSettings: function () {
		return {
			"desiredCapabilities": {
				"browserName" : "phantomjs",
				"javascriptEnabled" : true,
				"acceptSslCerts" : true,
				"phantomjs.binary.path" : phantomJsPath
			}	
		};
	}
});

module.exports = Nw;