/*
	Levels:
		log.trace(msg)
		log.debug(msg)
		log.info(msg)
		log.warn(msg)
		log.error(msg)
 */

global.log = require('loglevel');


var defaultSettings = {
	"loglevel": "info"
};

var logLevelOptions = require('rc')("spacejelly", defaultSettings);

log.setLevel(logLevelOptions.loglevel);