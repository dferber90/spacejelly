require('./log');
var _ = require('underscore');
var expect = require("chai").expect;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var ChildProcess = require('child_process');
var path = require('path');
var MongoDb = require('./MongoDb');
var containsStr = require('./util/str').containsStr;
var getUrlWithPort = require('./util/getUrlWithPort');

var defaultMeteorOptions = {
	"dir": ".",
	"release": false,
	"port": 4096,
	"production": false,
	"settings": false,
	"mongoUrl": false,
	"meteorReadyText": "=> App running at:",
	"meteorMongoDbReadyText": "=> Started MongoDB.",
	"meteorErrorText": "Waiting for file change."
};


function Meteor(options) {
	log.debug('Meteor.constructor()');
	options = options || {};
	
	this.options = _.defaults(options, defaultMeteorOptions);
	this.ready = false;
	this.mongo = false;

	log.debug('Meteor.options', this.options);
};

util.inherits(Meteor, EventEmitter);



_.extend(Meteor.prototype, {

	constructor: Meteor,

	start: function () {
		var self = this;

		log.debug('Meteor.start()');
		this.emit('start');

		this.childProcess = new ChildProcess.spawn(
			"meteor",
			this.getMeteorArgs(),
			this.getRuntimeOptions()
		);

		this.childProcess.stdout.on('data', function (data) {
			var dataStr = data.toString();
	
			log.debug('Meteor.childProcess.stdout', dataStr);


			if (containsStr(dataStr, self.options.meteorReadyText)) {
				log.debug('Meteor.childProcess.emit.started');
				self.ready = true;
				self.emit('started');
			} else if (containsStr(dataStr, self.options.meteorErrorText)) {
				log.debug('Meteor.childProcess.emit.error');
				self.ready = false;
				self.emit('error');
			} else if (containsStr(dataStr, self.options.meteorMongoDbReadyText)) {
				var meteorPid = self.childProcess.pid;
				self.mongo = new MongoDb(meteorPid);
				log.debug('Meteor.childProcess.emit.mongodb.started', meteorPid);
			}
		});

		this.childProcess.on('exit', function (code, signal) {
			log.debug('Meteor.childProcess.exit', code, signal);
			self.ready = false;
			self.emit('stopped');
		});
	},

	stop: function () {
		log.debug('Meteor.stop()');
		this.childProcess.kill();
		this.emit('stop');
	},

	getRuntimeOptions: function () {

		expect(this.options.dir, "meteor.dir must be a path").to.be.a('string').that.is.ok;
		var cwd = path.resolve(this.options.dir);

		var env = _.clone(process.env);

		env.ROOT_URL = getUrlWithPort(this.options.rootUrl, this.options.port);

		if (this.options.mongoUrl) {
			env.MONGO_URL = this.options.mongoUrl;
		} else if (env.MONGO_URL) {
			delete env.MONGO_URL;
		}

		var runtimeOptions = {
			"cwd": cwd,
			"env": env,
			"detached": false
		};

		log.debug('Meteor.getRuntimeOptions()', runtimeOptions);

		return runtimeOptions;
	},

	getMeteorArgs: function () {
		var meteorArgs = [];

		if (this.options.release)
			meteorArgs.push(["--release", this.options.release])

		if (this.options.port)
			meteorArgs.push(["--port", this.options.port])

		if (this.options.production)
			meteorArgs.push("--production")

		if (this.options.settings)
			meteorArgs.push(["--settings", this.options.settings])

		// flatten nested testPackages array into args
		meteorArgs = _.flatten(meteorArgs)

		log.debug('Meteor.getMeteorArgs()', meteorArgs);

		return meteorArgs;
	}
});


module.exports = Meteor;