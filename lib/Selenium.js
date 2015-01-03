require('./opt');
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
};

function Selenium(options) {
	log.debug('Selenium.constructor()');
	var self = this;
	
	options = options || {};
	this.options = _.defaults(options, defaultOptions);
	log.debug('Selenium.options', this.options);

	this.childProcess = false;
	this.ready = false;
	this.stopped = false;

	process.on('exit', function (code) {
		log.debug('Selenium.process.exit', code);
		self.stop(code);
	});
};

util.inherits(Selenium, EventEmitter);


_.extend(Selenium.prototype, {
	start: function () {
		log.debug('Selenium.start()');
		var self = this;
		expect(this.options.server_path, "No server path set.").to.be.a('string').that.is.not.empty;

		this.childProcess = new ChildProcess.spawn(
			"java",
			self.getSeleniumArgs(),
			self.getRuntimeOptions()
		);

		// selenium server uses stderr, so we may delete this
		/*
		this.childProcess.stdout.on('data', function (data) {
			var dataStr = data.toString();

			log.debug('Selenium.childProcess.stdout', dataStr);
		});
		*/

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

		var args = _.flatten([
			['-jar', this.options.server_path],
			['-host', this.options.host],
			['-port', this.options.port]
		]);

		// debug selenium, if loglevel is trace or debug
		var loglevel = opt.argv.loglevel.toLowerCase();
		if (loglevel === 'trace' || loglevel === 'debug') {
			args.push('-debug');
		}

		return args;
	},

	getRuntimeOptions: function () {
		log.debug('Selenium.getRuntimeOptions()');

		var cwd = path.resolve('.');
		var env = _.clone(process.env);

		var runtimeOptions = {
			"env": env,
			"cwd": cwd,
			"detached": false
		};

		log.trace('Selenium.getRuntimeOptions', runtimeOptions);

		return runtimeOptions;
	},

	stop: function (code) {
		log.debug('Selenium.stop()');
		if (this.stopped) return;

		this.stopped = true;

		if (this.childProcess) {
			this.childProcess.kill();
		}

		this.emit('stop', code);
	}
});




module.exports = Selenium;