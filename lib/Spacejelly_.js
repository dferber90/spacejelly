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
var createTmpJSONFileFromObject = require('./util/createTmpJSONFileFromObject');
var startsWith = require('./util/str').startsWith;
var expect = require("chai").expect;


// -----------------------------------------------------------------
// 							Constants
// -----------------------------------------------------------------

var TMP_FILE_NAME = 'spacejelly.nightwatch.json',
	SELENIUM_JAR = 'selenium-server-standalone-2.43.1.jar';

var EXIT_CODES = {
	ALL_WELL: 0,
	SPACEJELLY_FAILED: 1,
	SPACEJELLY_TIMEOUT: 2,
	METEOR_FAILED: 3,
	MONGO_FAILED: 4,
	SELENIUM_FAILED: 5,
	NIGHTWATCH_FAILED: 6,
	TESTS_FAILED: 7
};

// -----------------------------------------------------------------
// 							Constructor
// -----------------------------------------------------------------

var defaultOptions = {
	startSelenium: true, // should spacejelly start selenium (instead of nightwatch or manual start)?
	replaceSeleniumPath: true, // should spacejelly replace server_path in nightwatch.json to use spacejelly's bundled jar?
	meteor: {}, // options for meteor
	nightwatch: {} // options for nightwatch
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
};

util.inherits(Spacejelly, EventEmitter);

// -----------------------------------------------------------------
// 							Prototype
// -----------------------------------------------------------------

_.extend(Spacejelly.prototype, {


	run: function () {
		log.debug('Spacejelly.run()');
		var self = this;

		log.info('spacejelly: starting');

		try {
			this.options = loadConfig(this.args.config, _.clone(defaultOptions));
		} catch (error) {
			log.warn(error.message);
			this.exit(EXIT_CODES.SPACEJELLY_FAILED);
		}

		if (this.options.timeout) {
			expect(this.options.timeout, "Expected timeout to be a number").to.be.a('number');

			this.timeout = setTimeout(function () {
				log.error('spacejelly: stopping because of timeout');
				self.exit(EXIT_CODES.SPACEJELLY_TIMEOUT);
			}, this.options.timeout * 1000);
		}
		
		this.on('setup.complete', function () {
			log.debug('main.setup.complete');
			
			this.runTests();
		});

		this.on('tests.complete', function (result) {
			log.debug('main.tests.complete.');

			this.stopServices();
			this.report(result);
		});

		this.startServices();
	},

	startServices: function () {
		var self = this;
		log.debug('Spacejelly.startServices()');

		prepareConfig.call(this);
		this.tmpNightwatchPath = createTmpJSONFileFromObject(
			TMP_FILE_NAME,
			this.options.nightwatch
		);

		if (this.tmpNightwatchPath) {
			log.info('spacejelly: created nightwatch config (' + this.tmpNightwatchPath + ')');
		} else {
			log.warn('Failed to create nightwatch config.');
			this.exit(EXIT_CODES.SPACEJELLY_FAILED);
		}


		
		log.info('spacejelly: starting meteor');

		// start meteor
		
		this.meteor = new Meteor(this.options.meteor);

		this.meteor.on('started', function () {
			log.info('spacejelly: meteor started.');

			if (!self.ready && (!self.options.startSelenium || self.selenium.ready)) {
				self.ready = true;
				self.emit('setup.complete');
			}
		});

		this.meteor.on('stop', function () {
			log.info('spacejelly: stopped meteor.');
		});

		this.meteor.on('error', function () {
			log.info('spacejelly: meteor app has an error.');
			self.exit();
		});
		
	
		// start selenium, if spacejelly should handle it
		if (this.options.startSelenium) {
			log.info('spacejelly: starting selenium');
			this.selenium = new Selenium(this.options.nightwatch.selenium);

			this.selenium.on('started', function () {
				log.info('spacejelly: selenium started.');
				
				if (!self.ready && self.meteor.ready) {
					log.debug('Spacejelly.setup.startSelenium.emit.setup.complete');
					self.ready = true;
					self.emit('setup.complete');
				}
			});

			this.selenium.on('stop', function () {
				log.info('spacejelly: stopped selenium.');
			});

			this.selenium.start();
		}

		this.meteor.start();

		return this;
	},

	runTests: function () {
		var self = this;
		log.debug('Spacejelly.runTests()');
		log.info('spacejelly: running tests.');

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

		this.nw.start();

		return this;
	},

	report: function (result) {
		log.debug('Spacejelly.exit');

		// exit with correct code
		if (! result) {
			log.info('spacejelly: ✗ tests failed.');
			this.exit(EXIT_CODES.TESTS_FAILED);
		}
		
		log.info('spacejelly: ✓ tests successfull.');
		this.exit(EXIT_CODES.ALL_WELL);
	},

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

		// if we created a tmp-file, we must delete it
		if (this.tmpNightwatchPath) {
			log.debug('Spacejelly.tearDown.removeTmpFile');

			fs.unlinkSync(this.tmpNightwatchPath);
			// TODO delete the parent folder of the file as well,
			// since we created it.
		}

		return this;
	},

	exit: function (code) {
		log.debug('Spacejelly.exit', code);

		this.stopServices();
		process.exit(code);
	}
});

// -----------------------------------------------------------------
// 							Private
// -----------------------------------------------------------------



/**
 * Edits the provided config and propagates values.
 */
var prepareConfig = function () {

	if (this.options.replaceSeleniumPath) {
		_.extend(this.options.nightwatch.selenium, {
			"server_path": path.resolve(path.join(__dirname, SELENIUM_JAR))
		});
	}

	if (this.options.startSelenium) {
		_.extend(this.options.nightwatch.selenium, {
			"start_process": false
		});
	}

	/*
	// make sure rootUrl is set and chop of last char if it is "/"
	if (!this.options.meteor.rootUrl) {
		log.error('spacejelly: missing meteor.rootUrl in config.');
		this.exit(EXIT_CODES.SPACEJELLY_FAILED);
	} else if (this.options.meteor.rootUrl.slice(-1) === '/') {
		this.options.meteor.rootUrl = this.options.meteor.rootUrl.slice(0, -1);
	}
	*/
};

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