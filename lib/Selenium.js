require('./log');
var expect = require("chai").expect;
var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var ChildProcess = require('child_process');
var containsStr = require('./util/str').containsStr;


var defaultOptions = {
	"start_process": false,
	"server_path": false,
	"log_path": "",
	"host": "127.0.0.1",
	"port": 4444,
	"cli_args": {
		"webdriver.chrome.driver" : "",
		"webdriver.ie.driver" : ""
	},
	"seleniumReadyText": "Started org.openqa.jetty.jetty.Server"
}

var Selenium = function (options) {
	log.debug('Selenium.constructor()');
	var self = this;
	
	this.options = _.extend(defaultOptions, options);
	log.debug('Selenium.options', this.options);

	this.childProcess = false;
	this.ready = false;
	this.stopped = false;

	process.on('exit', function (code) {
		log.debug('Selenium.process.exit', code);
		self.stop();
	});
};

util.inherits(Selenium, EventEmitter);


_.extend(Selenium.prototype, {
	start: function () {
		log.debug('Selenium.start()');
		var self = this;
		expect(this.options.server_path, "No server path set.").to.be.a('string');

		this.childProcess = new ChildProcess.spawn(
			"java",
			this.getSeleniumArgs(),
			this.getRuntimeOptions
		);

		// selenium server uses stderr, so we may delete this
		this.childProcess.stdout.on('data', function (data) {
			var dataStr = data.toString();

			log.debug('Selenium.childProcess.stdout', dataStr);
		});

		this.childProcess.stderr.on('data', function (data) {
			var dataStr = data.toString();

			log.debug('Selenium.childProcess.stderr', dataStr);

			if (containsStr(dataStr, self.options.seleniumReadyText)) {
				log.debug('Selenium.childProcess.ready');
				self.ready = true;
				self.emit('started');
			}
			// TODO handle errors => stop everything
		});

		this.childProcess.on('exit', function (code, signal) {
			log.debug('Selenium.childProcess.exit', code, signal);
			self.ready = false;
		});
	},

	getSeleniumArgs: function () {
		log.debug('Selenium.getSeleniumArgs()');

		return _.flatten([
			['-jar', this.options.server_path],
			['-host', this.options.host],
			['-port', this.options.port],
			'-debug'
		]);
	},

	getRuntimeOptions: function () {
		log.debug('Selenium.getRuntimeOptions()');

		var cwd = path.resolve('.');
		var env = _.clone(process.env);

		var runtimeOptions = {
			"cwd": cwd,
			"detached": false
		};

		log.trace('Selenium.getRuntimeOptions', runtimeOptions);

		return runtimeOptions;
	},

	stop: function () {
		log.debug('Selenium.stop()');
		if (this.stopped) return;

		this.stopped = true;
		this.childProcess.kill();
		this.emit('stop');
	}
});




module.exports = Selenium;