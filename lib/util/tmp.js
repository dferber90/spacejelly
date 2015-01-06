var os = require('os');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');


var getRandomInt = function () {
	return _.random(0, 9);
};

var isInDir = function (child, parent) {
	var realChild = fs.realpathSync(child),
		realParent = fs.realpathSync(parent);

	return realChild.indexOf(realParent) === 0;
};

module.exports = {
	create: function (fileName, obj) {
		
		// pretty prints the json, using 4 indendations
		var stringifiedObj = JSON.stringify(obj, null, 4),
			ext            = path.extname(fileName),
			name           = path.basename(fileName, ext),
			i              = getRandomInt(),
			tmpDir         = os.tmpdir(), // cache for loop
			rnd;

		do {
			rnd = process.pid + i;
			filePath = path.join(tmpDir, name + rnd.toString() + ext);
			i += getRandomInt(); // += to exceed available number space eventually
		} while (fs.existsSync(filePath));

		fs.writeFileSync(filePath, stringifiedObj);

		return filePath;
	},

	// has to be fully synchronous as it is run as a process exit handler
	remove: function (tmpFile, cb) {

		if (isInDir(tmpFile, os.tmpdir())) {
			fs.unlinkSync(tmpFile);
		}
	}
};