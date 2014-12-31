require('./log');
var _ = require('underscore');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var ChildProcess = require('child_process');
var path = require('path');
var MongoDb = require('./MongoDb');
var containsStr = require('./util/str').containsStr;


var defaultMeteorOptions = {
	"dir": '.',
	"release": false,
	"port": 4096,
	"development": false,
	"settings": false,
	"mongoUrl": false,
	"meteorReadyText": "=> App running at:",
	"meteorMongoDbReadyText": "=> Started MongoDB.",
	"meteorErrorText": "Waiting for file change."
};


var Meteor = function (options) {
	this.options = _.extend(defaultMeteorOptions, options);
	this.ready = false;

	log.trace('Meteor.options', this.options);
};


util.inherits(Meteor, EventEmitter);



_.extend(Meteor.prototype, {
	start: function () {
		var self = this;

		log.debug('Meteor.start');
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
			this.ready = false;
			this.emit('stopped');
		});
	},

	stop: function () {
		log.debug('Meteor.stop');
		this.childProcess.kill();
		this.emit('stop');
	},

	getRuntimeOptions: function () {
		var cwd = path.resolve(this.options.dir);

		var env = _.clone(process.env);
		env.ROOT_URL = 'http://localhost:' + this.options.port + '/';

		if (this.options.mongoUrl) {
			env.MONGO_URL = this.options.mongoUrl
		} else if (env.MONGO_URL) {
			delete env.MONGO_URL;
		}

		var runtimeOptions = {
			"cwd": cwd,
			"env": env,
			"detached": false
		};

		log.trace(['Meteor.getRuntimeOptions', runtimeOptions]);

		return runtimeOptions;
	},

	getMeteorArgs: function () {
		var meteorArgs = [];

		if (this.options.release)
			meteorArgs.push(["--release", this.options.release])

		if (this.options.port)
			meteorArgs.push(["--port", this.options.port])

		if (! this.options.development)
			meteorArgs.push("--production")

		if (this.options.settings)
			meteorArgs.push(["--settings", this.options.settings])

		// flatten nested testPackages array into args
		meteorArgs = _.flatten(meteorArgs)

		log.debug('Meteor.getMeteorArgs', meteorArgs);

		return meteorArgs;
	}
});



/*
var meteorOptions,
	meteorOptionsDefaults = {
	"dir": '.',
	"release": false,
	"port": 4096,
	"development": false,
	"settings": false,
	"mongoUrl": false,
	"meteorReadyText": "=> App running at:",
	"meteorErrorText": "Waiting for file change."
};

var meteorOptionsPath = path.resolve(argv.meteor);

log.debug('meteorOptionsPath', meteorOptionsPath);

if (meteorOptionsPath && fs.existsSync(meteorOptionsPath)) {
	log.debug('reading meteor file');
	meteorOptions = require(meteorOptionsPath);
	meteorOptions = _.extend(meteorOptionsDefaults, meteorOptions);
} else {
	log.debug('not trying to read meteor file');
	meteorOptions = meteorOptionsDefaults;
}

var meteorArgs = [];

if (meteorOptions.release)
	meteorArgs.push(["--release", meteorOptions.release])

if (meteorOptions.port)
	meteorArgs.push(["--port", meteorOptions.port])

if (! meteorOptions.development)
	meteorArgs.push("--production")

if (meteorOptions.settings)
	meteorArgs.push(["--settings", meteorOptions.settings])

// flatten nested testPackages array into args
meteorArgs = _.flatten(meteorArgs)

log.debug('meteorArgs=' + meteorArgs);


var env = _.clone(process.env);
env.ROOT_URL = 'http://localhost:' + meteorOptions.port + '/';

if (meteorOptions.mongoUrl) {
	env.MONGO_URL = meteorOptions.mongoUrl
} else if (env.MONGO_URL) {
	delete env.MONGO_URL;
}

var cwd = path.resolve(meteorOptions.dir);

var runtimeOptions = {
	"cwd": cwd,
	"env": env,
	"detached": false
};

log.debug('runtimeOptions', runtimeOptions);

var childProcess = new ChildProcess.spawn("meteor", meteorArgs, runtimeOptions);

childProcess.on('exit', function (code, signal) {
	log.debug('exit', code, signal);
});

childProcess.stdout.on('data', function (data) {
	log.debug(data.toString());
});

childProcess.stderr.on('data', function (data) {
	log.debug('err: ', data.toString());
});
*/

module.exports = Meteor;