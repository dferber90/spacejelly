require('./opt');
/*
	Levels:
		log.trace(msg)
		log.debug(msg)
		log.info(msg)
		log.warn(msg)
		log.error(msg)
 */

global.log = require('loglevel');
log.setLevel(opt.argv.loglevel);
