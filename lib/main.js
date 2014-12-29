// arguments
var fs = require('fs');
var _ = require('underscore');
var tempWrite = require('temp-write');
var argv = require('optimist').argv;
var path = require('path');
var phantomjs = require('phantomjs');
var phantomJsPath = phantomjs.path;
var Nightwatch = require('nightwatch/lib/index.js');
var EventEmitter = require('events').EventEmitter;
var ChildProcess = require('child_process');

// -----------------------------------------------------------------
// 							SETUP
// -----------------------------------------------------------------

// first, we read the provided nightwatch config
var nightwatchSourceCfgPath = path.resolve(argv.nw);
var nightwatchJSON = require(nightwatchSourceCfgPath);

// then, we replace the desired keys
var seleniumServerJar = 'selenium-server-standalone-2.43.1.jar';
var seleniumServerPath = path.join(__dirname, seleniumServerJar);

nightwatchJSON.selenium.server_path = path.resolve(seleniumServerPath);

// then we save to tmp-folder
var TMPFILENAME = 'spacejelly.nightwatch.json';
var stringifiedNightwatchJSON = JSON.stringify(nightwatchJSON, null, 4); // pretty prints the json

var tmpNwCfgFilePath = tempWrite.sync(stringifiedNightwatchJSON, TMPFILENAME);



// -----------------------------------------------------------------
// 							METEOR
// -----------------------------------------------------------------

console.log('Starting Meteor');
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

console.log(['meteorOptionsDefaults', meteorOptionsPath]);

if (meteorOptionsPath && fs.existsSync(meteorOptionsPath)) {
	console.log('reading meteor file');
	meteorOptions = require(meteorOptionsPath);
	meteorOptions = _.extend(meteorOptionsDefaults, meteorOptions);
} else {
	console.log('not trying to read meteor file');
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

console.log('meteorArgs=' + meteorArgs);


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

console.log(['runtimeOptions', runtimeOptions]);

var childProcess = new ChildProcess.spawn("meteor", meteorArgs, runtimeOptions);

childProcess.on('exit', function (code, signal) {
	console.log(['exit', code, signal]);
});

childProcess.stdout.on('data', function (data) {
	console.log(data.toString());
});

childProcess.stderr.on('data', function (data) {
	console.log(['err: ', data.toString()]);
});


// TODO überall den event-emitter nutzen.
// Teile in eigene Module verpacken.
// Logging mit verschiedenen Levels.
// MongoDB terminieren, zusammen mit Meteor (ist in spacejam)

/*
setTimeout(function () {
	console.log('killing meteor');
	childProcess.kill();
}, 10000);
*/


// -----------------------------------------------------------------
// 							TESTING
// -----------------------------------------------------------------

/*
var commandLineOptions = {
	config: tmpNwCfgFilePath, // ./nightwatch.json	The location of the nightwatch.json file - the configuration file which the runner uses and which also includes the Selenium WebDriver options.
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

// overrides test_settings in nightwatch.json (specified in commandLineOptions.config)
var settings = {
	"desiredCapabilities": {
		"browserName" : "phantomjs",
		"javascriptEnabled" : true,
		"acceptSslCerts" : true,
		"phantomjs.binary.path" : phantomJsPath
	}
};

var done = function (err) {
	if (err) throw err;

	console.log("done");

	// clean up the tmp file
	console.log('cleaning up ' + tmpNwCfgFilePath);
	fs.unlink(tmpNwCfgFilePath);
};

var nw = Nightwatch.runner(commandLineOptions, done, settings);
// console.log(nw);
*/