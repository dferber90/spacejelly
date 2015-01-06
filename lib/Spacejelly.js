require('./log');
var fs = require('fs');
var _ = require('underscore');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var Meteor = require('./Meteor');
var Nw = require('./Nw');
var Selenium = require('./Selenium');
var loadConfig = require('./util/loadConfig');
var util = require('util');
var stripJsonComments = require('strip-json-comments');
var getUrlWithPort = require('./util/getUrlWithPort');
var tmp = require('./util/tmp');
var startsWith = require('./util/str').startsWith;
var expect = require("chai").expect;


// -----------------------------------------------------------------
// 							Constants
// -----------------------------------------------------------------

var TMP_FILE_NAME = 'spacejelly.nightwatch.json',
	SELENIUM_JAR = 'selenium-server-standalone-2.43.1.jar',
	DEFAULT_SPACEJELLY_CFG_PATH = './tests/spacejelly/spacejelly.js';

// try not to interfere with node exit codes and standard exit codes
// standard: http://tldp.org/LDP/abs/html/exitcodes.html
// node:     https://github.com/joyent/node/blob/master/doc/api/process.markdown#exit-codes
var EXIT_CODES = {
	ALL_WELL: 0,
	TESTS_FAILED: 21,
	SPACEJELLY_FAILED: 22,
	SPACEJELLY_TIMEOUT: 23,
	METEOR_FAILED: 24,
	MONGO_FAILED: 25,
	SELENIUM_FAILED: 26,
	NIGHTWATCH_FAILED: 27,
	INTERRUPTED: 130 // 128 + 2 standard exit code
};

// -----------------------------------------------------------------
// 							Constructor
// -----------------------------------------------------------------

var defaultOptions = {
	startSelenium: true, // should spacejelly start selenium (instead of nightwatch or manual start)?
	replaceSeleniumPath: true, // should spacejelly replace server_path in nightwatch.json to use spacejelly's bundled jar?
	timeout: false, // timeout for tests in seconds. false = no timeout
	meteor: {}, // options for meteor
	nightwatch: { selenium: {} } // options for nightwatch
};

var Spacejelly = function (args) {
	log.debug('Spacejelly.constructor()');
	var self = this;

	/**
	 * Command line options Spacejelly was started with.
	 * @type {Object}
	 */
	this.args = args || {};

	// Is true when meteor (and selenium, if required) are ready.
	// Necessary to avoid emitting 'ready' twice.
	this.ready = false;

	/**
	 * true if stopping of all child processes was initiated.
	 * @type {Boolean}
	 */
	this.stopped = false;


	/**
	 * Options for spacejelly, nightwatch, meteor.
	 * @type {Object}
	 */
	this.options = false;

	this.tmpNightwatchPath = false;
	
	this.meteor = false;
	this.nw = false;
	this.selenium = false;



	/**
	 * Holds the timeoutObject, if Spacejelly was started with a timeout.
	 * @type {Object}
	 */
	this.timeout = false;


	process.on('SIGINT', function () {
		log.info('\nspacejelly: received interrupt. exiting.');
		
		self.stopServices();
		self.exit(EXIT_CODES.INTERRUPTED);
	});
};

util.inherits(Spacejelly, EventEmitter);

// -----------------------------------------------------------------
// 							Prototype
// -----------------------------------------------------------------

_.extend(Spacejelly.prototype, {

	init: function () {
		var self = this;


		var resolvedConfigPath = path.resolve(this.args.config ? this.args.config : DEFAULT_SPACEJELLY_CFG_PATH);
		// try to load from provided path, or try to load from default location
		try {
			this.options = loadConfig(resolvedConfigPath);
		} catch (error) {
			if (error.code !== 'MODULE_NOT_FOUND') {
				log.warn(error.message);
				this.exit(EXIT_CODES.SPACEJELLY_FAILED);
			}
		}

		if (! this.options) {
			if (this.args.config) {
				log.warn('spacejelly: config file not found in ' + resolvedConfigPath);
				this.exit(EXIT_CODES.SPACEJELLY_FAILED);
			} else {
				log.info('spacejelly: no config file found. using default options.');
				this.options = _.clone(defaultOptions);
			}
		}


		// overwrite settings with command-line options

		if (this.args['no-selenium']) {
			this.options.startSelenium = false;
		}

		if (this.args['no-replace']) {
			this.options.replaceSeleniumPath = false;
		}

		if (this.args.timeout) {
			expect(this.args.timeout, 'timeout').to.be.a('number').that.is.above(-1);
			this.options.timeout = this.args.timeout;
		}


		// propagate settings to other fields
		if (this.options.replaceSeleniumPath) {
			_.extend(self.options.nightwatch.selenium, {
				"server_path": path.resolve(path.join(__dirname, SELENIUM_JAR))
			});
		}

		if (this.options.startSelenium) {
			_.extend(self.options.nightwatch.selenium, {
				"start_process": false
			});
		}

		// create tmp/../spacejelly.nightwatch.json
		var nwDefaults = _.defaults(
			this.options.nightwatch,
			Nw.getDefaults(path.join(process.cwd(), 'tests', 'spacejelly'))
		);
		this.tmpNightwatchPath = tmp.create(
			TMP_FILE_NAME,
			nwDefaults
		);

		process.on('exit', function () {

			if (self.tmpNightwatchPath) {
				tmp.remove(self.tmpNightwatchPath);
			}

		});

		return this;
	},

	startServices: function () {
		var self = this;

		this.meteor = new Meteor(this.options.meteor);

		this.meteor.on('started', function () {
			log.info('spacejelly: meteor started.');

			if (!self.ready && (!self.options.startSelenium || self.selenium.ready)) {
				self.ready = true;
				self.emit('setup.complete');
			}
		});

		this.meteor.on('stop', function () {
			log.debug('spacejelly: stopped meteor.');
		});

		this.meteor.on('error', function () {
			log.info('spacejelly: meteor app has an error.');
			self.exit(EXIT_CODES.METEOR_FAILED);
		});
		
		log.debug('spacejelly: starting meteor.');
		this.meteor.start();
	
		// start selenium, if spacejelly should handle it
		if (this.options.startSelenium) {
			log.debug('spacejelly: starting selenium.');
			this.selenium = new Selenium(this.options.nightwatch.selenium);

			this.selenium.on('started', function () {
				log.info('spacejelly: selenium started.');
				
				if (!self.ready && self.meteor.ready) {
					log.debug('Spacejelly.setup.startSelenium.emit.setup.complete');
					self.ready = true;
					self.emit('setup.complete');
				}
			});

			// TODO selenium does not yet emit error
			this.selenium.on('error', function (err) {
				log.info('spacejelly: selenium has an error.', err);
				self.exit(EXIT_CODES.SELENIUM_FAILED);
			});

			this.selenium.on('stop', function () {
				log.debug('spacejelly: stopped selenium.');
			});

			this.selenium.start();
		}

		process.on('exit', function () {
			self.stopServices();
		});

		return this;
	},

	// this (and all called functions within) have to be fully
	// synchronous, as stopServices gets called from within an exit handler.
	stopServices: function () {
		// skip, if services were already stopped.
		if (this.stopped) {
			return this;
		}
		this.stopped = true;


		// stop timeout
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = false;
		}

		// stop services
		if (this.meteor) {
			this.meteor.stop();
		}

		if (this.selenium) {
			this.selenium.stop();
		}

		return this;
	},

	runTests: function () {
		log.info('spacejelly: running tests.');
		var self = this;

		var testSettings = {
			"launch_url": getUrlWithPort(
				self.options.meteor.rootUrl,
				self.options.meteor.port
			)
		};

		this.nw = new Nw(
			this.tmpNightwatchPath,
			testSettings,
			getNightwatchOptions(self.args) // cli options for nightwatch, from spacejelly
		);

		this.nw.on('completed', function (result) {
			log.info('spacejelly: tests completed.');
			self.emit('tests.complete', result);
		});

		// TODO nightwatch does not yet emit error
		this.nw.on('error', function (err) {
			log.info('spacejelly: nightwatch failed.', err);
			self.exit(EXIT_CODES.NIGHTWATCH_FAILED);
		});

		this.nw.start();

		return this;
	},

	report: function (result) {
		log.debug('Spacejelly.report');

		// exit with correct code
		if (result) {
			log.info('spacejelly: ✓ tests successfull.');
			this.exit(EXIT_CODES.ALL_WELL);
		}
		
		log.info('spacejelly: ✗ tests failed.');
		this.exit(EXIT_CODES.TESTS_FAILED);
	},

	exit: function (code) {
		log.debug('Spacejelly.exit', code);

		process.exit(code);
	},

	run: function () {
		var self = this;

		log.info('spacejelly: starting');

		this.init();

		if (this.options.timeout) {
			this.startTimeout();
		}

		this.on('setup.complete', function () {
			log.debug('main.setup.complete');
			
			this.runTests();
		});

		this.on('tests.complete', function (result) {
			log.debug('main.tests.complete.');

			this.report(result);
		});

		this.startServices();
	},

	startTimeout: function () {
		var self = this;

		expect(this.options.timeout, "Expected timeout to be a number").to.be.a('number');

		this.timeout = setTimeout(function () {
			log.error('spacejelly: stopping because of timeout');
			self.exit(EXIT_CODES.SPACEJELLY_TIMEOUT);
		}, this.options.timeout * 1000);
	}
});

// -----------------------------------------------------------------
// 							Private
// -----------------------------------------------------------------


/**
 * Finds command line args for nightwatch (starting with "nw-") that were passed to spacejelly.
 *
 * Renames the keys accordingly, e.g. nw-env -> env
 * @param  {Array} args Arguments passed to spacejelly.
 * @return {Object}      Arguments
 */
var getNightwatchOptions = function (args) {

	var prefix = 'nw-',
		prefixLength = prefix.length,
		nightwatchOptions = {};

	_.each(args, function (val, key) {
		if (startsWith(key, prefix)) {
			nightwatchOptions[key.substr(prefixLength)] = val;
		}
	});

	return nightwatchOptions;
};

// -----------------------------------------------------------------
// 							Export
// -----------------------------------------------------------------

module.exports = Spacejelly;