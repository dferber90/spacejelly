require('./log');
var fs = require('fs');
var _ = require('underscore');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var Meteor = require('./Meteor');
var Nw = require('./Nw');
var Selenium = require('./Selenium');
var tempWrite = require('temp-write');
var util = require('util');
var stripJsonComments = require('strip-json-comments');



// -----------------------------------------------------------------
// 							Constants
// -----------------------------------------------------------------

var TMP_FILE_NAME = 'spacejelly.nightwatch.json',
	SELENIUM_JAR = 'selenium-server-standalone-2.43.1.jar',
	DEFAULT_SPACEJELLY_CFG_PATH = './tests/spacejelly/spacejelly.js';

var EXIT_CODES = {
	ALL_WELL: 0,
	SPACEJELLY_FAILED: 1,
	METEOR_FAILED: 2,
	MONGO_FAILED: 3,
	SELENIUM_FAILED: 4,
	NIGHTWATCH_FAILED: 5,
	TESTS_FAILED: 6
};

// -----------------------------------------------------------------
// 							Constructor
// -----------------------------------------------------------------

var defaultConfig = {
	startSelenium: true,
	replaceSeleniumPath: true,
	meteor: {},
	nightwatch: {}
};

var Spacejelly = function (configPath) {
	log.debug('Spacejelly.constructor()');

	configPath = configPath || DEFAULT_SPACEJELLY_CFG_PATH;
	this.options = _.extend(defaultConfig, loadConfig(configPath));

	this.tmpNightwatchPath = false;
	
	this.meteor = false;
	this.nw = false;
	this.selenium = false;

	// Is true when meteor (and selenium, if required) are ready.
	// Necessary to avoid emitting 'ready' twice.
	this.ready = false;

	/**
	 * true if stopping of all child processes was initiated.
	 * @type {Boolean}
	 */
	this.stopped = false;
};

util.inherits(Spacejelly, EventEmitter);

// -----------------------------------------------------------------
// 							Prototype
// -----------------------------------------------------------------

_.extend(Spacejelly.prototype, {

	run: function () {
		log.debug('Spacejelly.run()');

		log.info('spacejelly: starting');
		
		this.on('setup.complete', function () {
			log.debug('main.setup.complete');
			
			this.runTests();
		});

		this.on('tests.complete', function (result) {
			log.debug('main.tests.complete.');

			this.tearDown(result);
		});

		this.setup();
	},

	setup: function () {
		var self = this;
		log.debug('Spacejelly.setup()');

		prepareConfig.call(this);
		if (this.tmpNightwatchPath) {
			log.info('spacejelly: created nightwatch config at', this.tmpNightwatchPath);
		} else {
			log.warn('Failed to create nightwatch config.');
			this.exit(EXIT_CODES.SPACEJELLY_FAILED);
			return;
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

			// TODO: set launch_url by reading from Spacejelly cfg.
			"launch_url": self.options.meteor.rootUrl
		};

		this.nw = new Nw(this.tmpNightwatchPath, testSettings);
		this.nw.on('completed', function (result) {
			log.info('spacejelly: tests completed.');
			self.emit('tests.complete', result);
		});

		this.nw.start();

		return this;
	},

	tearDown: function (result) {
		log.debug('Spacejelly.exit');

		this.stopServices();

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
 * Loads the config.
 * It could either be a .json-file (with comments), or a .js-file.
 * 
 * @param  {String} configPath Path to .js or .json file.
 * @return {Object}            Parsed config file.
 */
var loadConfig = function (configPath) {

	if (configPath.substr(-3).toLowerCase() === '.js') {
		return require(path.resolve(configPath));
	} else if (configPath.substr(-5).toLowerCase() === '.json') {
		var resolvedPath = path.resolve(configPath);
		var fileContents = fs.readFileSync(resolvedPath);
		var strippedComments = stripJsonComments(fileContents.toString());
		return JSON.parse(strippedComments);
	} else {
		log.warn('Unkown config file type:', configPath);
		this.exit(EXIT_CODES.SPACEJELLY_FAILED);
		return;
	}
};

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

	this.tmpNightwatchPath = createTmpCfgFile.call(this);
};


var createTmpCfgFile = function () {
	log.debug('Spacejelly.createTmpCfgFile');
	// pretty prints the json, usiug 4 indendations
	var stringifiedCfg = JSON.stringify(this.options.nightwatch, null, 4);
	return tempWrite.sync(stringifiedCfg, TMP_FILE_NAME);
};

// -----------------------------------------------------------------
// 							Export
// -----------------------------------------------------------------

module.exports = Spacejelly;