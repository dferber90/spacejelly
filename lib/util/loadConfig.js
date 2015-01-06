require('../log');
var fs = require('fs');
var path = require('path');


// -----------------------------------------------------------------
// 							Private
// -----------------------------------------------------------------

var loadConfig = function (resolvedFilePath) {
	var config;

	if (! fs.existsSync(resolvedFilePath)) {
		return false; // will use defaults instead
	}

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