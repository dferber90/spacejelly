require('../log');
var fs = require('fs');
var path = require('path');

// -----------------------------------------------------------------
// 							Constants
// -----------------------------------------------------------------

var DEFAULT_SPACEJELLY_CFG_PATH = './tests/spacejelly/spacejelly.js';


// -----------------------------------------------------------------
// 							Private
// -----------------------------------------------------------------

var loadConfig = function (resolvedConfigPath, defaultConfig) {
	var cfg;

	var resolvedDefaultConfigPath = path.resolve(DEFAULT_SPACEJELLY_CFG_PATH);

	if (resolvedConfigPath) {
		resolvedPath = path.resolve(resolvedConfigPath);
		cfg = loadFileContents(resolvedPath);
	} else if (fs.existsSync(resolvedDefaultConfigPath)) {
		cfg = loadFileContents(resolvedDefaultConfigPath);
	} else {
		cfg = defaultConfig;
	}

	return cfg;
};

var loadFileContents = function (resolvedFilePath) {
	var config;

	if (resolvedFilePath.substr(-3).toLowerCase() === '.js') {
		return require(resolvedFilePath);
	} else if (resolvedFilePath.substr(-5).toLowerCase() === '.json') {
		var fileContents = fs.readFileSync(resolvedFilePath);
		var strippedComments = stripJsonComments(fileContents.toString());
		return JSON.parse(strippedComments);
	} else {
		throw new Error('Unknown config format ' + resolvedFilePath);
	}
};


// -----------------------------------------------------------------
// 							Export
// -----------------------------------------------------------------


module.exports = loadConfig;