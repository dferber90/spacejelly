require('./opt');
require('./log');
var path = require('path');
var Spacejelly = require('./Spacejelly');


if (opt.argv.help) {
	opt.showHelp(log.error);
} else if (opt.argv.version) {
	var packageConfig = require(path.join(__dirname, '../package.json'));
	log.error(packageConfig.name + ' v' + packageConfig.version);
} else {
	var spacejelly = new Spacejelly(opt.argv);
	spacejelly.run();
}