require('./log');
var util = require('util');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var phantomJsPath = require('phantomjs').path;
var Nightwatch = require('nightwatch/lib/index.js');

function Nw(configPath, testSettings, cliOptions) {
	log.debug('Nw.constructor()');

	var self = this;
	this.configPath = configPath;
	this.testSettings = testSettings || {};
	this.cliOptions = cliOptions || {};

	this.nightwatch = false;
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

		var opts = _.clone(self.cliOptions);

		// suggest default environment
		_.defaults(opts, { env: 'default' });

		// force config path
		opts.config = self.configPath;

		return opts;
	},

	getTestsCompleteCallback: function () {
		log.debug('Nw.getTestsCompleteCallback()');

		var self = this;
		return function (result) {
			// result is true, if all tests ran and 
			// no tests failed

			// if no tests ran, because there was an error,
			// then result is surprisingly "true" as well

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


// static
_.extend(Nw, {
	getDefaults: function (baseDir) {


		var globalData = {};
		var globalDataPath = path.join(baseDir, './data/dev');
		try {
			globalData = require(path.join(globalDataPath));
		} catch (err) {
			if (err.code !== 'MODULE_NOT_FOUND') {
				log.warn('spacejelly: error while requiring test default data.', err);
			}
		}

		return {
			"src_folders" : ["./tests/spacejelly/tests"],
			"output_folder" : "./tests/spacejelly/reports",
			"custom_commands_path" : "./tests/spacejelly/commands",
			"custom_assertions_path" : "./tests/spacejelly/assertions",
			"globals_path" : "",

			"selenium" : {
				"start_process" : false, // may be replaced (startSelenium)
				"server_path" : false,   // may be replaced (replaceSeleniumPath)
				"log_path" : "./tests/spacejelly/logs",
				"host" : "127.0.0.1",
				"port" : 4444,
				"cli_args" : {
					"webdriver.chrome.driver" : "",
					"webdriver.ie.driver" : ""
				}  
			},

			"test_settings" : {
				"default" : {
					"launch_url" : '', // will be provided by Spacejelly
					"selenium_port"  : 4444,
					"selenium_host"  : "localhost",
					"silent": true,
					"screenshots" : {
						"enabled" : false,
						"path" : ""
					},
					"globals": globalData, // ATTENTION: path is relative to tests/spacejelly-folder
					"desiredCapabilities": {} // provided by spacejelly
				}
			}
		}
	}
});

module.exports = Nw;