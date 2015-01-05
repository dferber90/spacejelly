var tempWrite = require('temp-write');

module.exports = function (fileName, obj) {
	
	// pretty prints the json, usiug 4 indendations
	var stringifiedObj = JSON.stringify(obj, null, 4);
	return tempWrite.sync(stringifiedObj, fileName);
};