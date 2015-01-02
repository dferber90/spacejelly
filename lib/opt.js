var usage = 'Usage: $0 [options]';
usage += '\n';
usage += 'For more information, see:';
usage += '\n';
usage += 'https://github.com/dferber90/spacejelly/blob/master/README.md';

var opt = require('optimist')
	.usage(usage)
	.options('h', {
		alias: 'help',
		describe: 'Shows this help'
	})
	.options('v', {
		alias: 'version',
		describe: 'Shows version information.'
	})
	.options('c', {
		alias: 'config',
		describe: 'Path to config file. File may either be JSON or JS.'
	})
	.options('l', {
		alias: 'loglevel',
		describe: 'Set the log level. Values: trace, debug, info, warn, error',
		default: 'info'
	});

global.opt = opt;