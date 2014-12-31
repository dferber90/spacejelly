require('./log');
var fs = require('fs');
var _ = require('underscore');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var ChildProcess = require('child_process');
var Meteor = require('./Meteor');
var Nw = require('./Nw');
var Selenium = require('./Selenium');
var tempWrite = require('temp-write');
var util = require('util');



// -----------------------------------------------------------------
// 							Constants
// -----------------------------------------------------------------

var SPACEJELLY = "spacejelly";
var TMP_FILE_NAME = 'spacejelly.nightwatch.json';
var SELENIUM_JAR = 'selenium-server-standalone-2.43.1.jar';


// -----------------------------------------------------------------
// 							Constructor
// -----------------------------------------------------------------


var Spacejelly = function (nightwatchOptionsPath, meteorOptionsPath) {
	log.debug('Spacejelly.constructor()');

	this.paths = {
		nightwatch: nightwatchOptionsPath,
		meteor: meteorOptionsPath
	};

	this.options = {
		nightwatch: {},
		meteor: {}
	};

	this.meteor = false;
	this.nw = false;
	this.selenium = false;

	this.startSelenium = false;
	this.usingSpacejellySeleniumJar = false;

	this.createdTmpNightwatchFile = false;

	this.ready = false;
};

util.inherits(Spacejelly, EventEmitter);

// -----------------------------------------------------------------
// 							Prototype
// -----------------------------------------------------------------

_.extend(Spacejelly.prototype, {

	readConfigs: function () {
		log.debug('Spacejelly.readConfigs');

		readMeteorConfig.call(this);
		readNightwatchConfig.call(this);

		return this;
	},

	setup: function () {
		var self = this;
		log.debug('Spacejelly.setup');

		// start meteor
		
		this.meteor = new Meteor(this.options.meteor);

		this.meteor.on('started', function () {
			log.debug('Meteor is ready!!');

			if (!self.ready && (!self.startSelenium || self.selenium.ready)) {
				self.ready = true;
				self.emit('setup.complete');
			}
		});
		
		this.meteor.start();
	
		// start selenium, if spacejelly should handle it
		if (this.startSelenium) {
			this.selenium = new Selenium(this.options.nightwatch.selenium);

			this.selenium.on('started', function () {
				log.debug('Selenium is ready!!');
				
				if (!self.ready && self.meteor.ready) {
					self.ready = true;
					self.emit('setup.complete');
				}
			});

			this.selenium.start();
		}

		return this;
	},

	runTests: function () {
		var self = this;
		log.debug('Spacejelly.runTests');


		this.nw = new Nw(this.paths.nightwatch);
		this.nw.on('completed', function (result) {
			self.emit('tests.completed', result);
		});

		this.nw.start();

		return this;
	},

	report: function (passed) {
		log.debug('Spacejelly.report');

		if (passed) {
			log.info('Spacjelly: Tests were successful ✓');
		} else {
			log.info('Spacjelly: Tests failed');
		}
	},

	explain: function () {
		log.debug("Spacjelly.explain.paths", this.paths);
		log.debug("Spacjelly.explain.options", this.options);
	},

	tearDown: function () {
		log.debug('Spacejelly.tearDown');

		if (this.meteor) {
			this.meteor.stop();
		}

		if (this.selenium) {
			this.selenium.stop();
		}

		if (this.createdTmpNightwatchFile) {
			log.debug('Spacejelly.tearDown.removeTmpFile');

			fs.unlinkSync(this.paths.nightwatch);
			// TODO delete the parent folder of the file as well,
			// since we created it.
		}
	}
});



// -----------------------------------------------------------------
// 							Private
// -----------------------------------------------------------------

var readMeteorConfig = function () {
	log.debug('Spacejelly.readMeteorConfig');

	this.options.meteor = require(path.resolve(this.paths.meteor));
};

var readNightwatchConfig = function () {
	log.debug('Spacejelly.readNightwatchConfig');

	var absoluteCfgPath = path.resolve(this.paths.nightwatch);
	this.options.nightwatch = require(absoluteCfgPath);


	var seleniumOptions = this.options.nightwatch.selenium,
		startProcess = seleniumOptions.start_process.toLowerCase(),
		serverPath = seleniumOptions.server_path.toLowerCase();

	// if serverPath is "spacejelly", then we need to replace it
	// so, we create a modified copy of the original cfg and save it to /tmp
	if (serverPath === SPACEJELLY) {
		this.usingSpacejellySeleniumJar = true;
		_.extend(this.options.nightwatch.selenium, {
			"server_path": path.resolve(path.join(__dirname, SELENIUM_JAR))
		});
	}

	// if start_process is spacejelly,
	// then, we need to start selenium.
	if (startProcess === SPACEJELLY) {
		this.startSelenium = true;

		_.extend(this.options.nightwatch.selenium, {
			"start_process": false
		});
	}

	// copy the file to /tmp, save new path to this.paths.nightwatch
	createTmpCfgFile.call(this);
};

var createTmpCfgFile = function () {
	log.debug('Spacejelly.createTmpCfgFile');
	// pretty prints the json, usiug 4 indendations
	var stringifiedCfg = JSON.stringify(this.options.nightwatch, null, 4); 
	this.createdTmpNightwatchFile = true;
	this.paths.nightwatch = tempWrite.sync(stringifiedCfg, TMP_FILE_NAME);
};

// -----------------------------------------------------------------
// 							Export
// -----------------------------------------------------------------

module.exports = Spacejelly;