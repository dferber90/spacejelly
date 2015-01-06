var usage = 'Usage: $0 [options]';
usage += '\n';
usage += 'For more information, see:';
usage += '\n';
usage += 'https://github.com/dferber90/spacejelly/blob/master/README.md';

global.opt = require('optimist')
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
	})

	// Nightwatch options
	.options('nw-env', {
		describe: 'Which testing environment to use - defined in spacejelly.json (nightwatch.test_settings)',
	})
	.options('nw-output', {
		describe: 'The location where the JUnit XML reports will be saved.', // overwrites spacejelly settings file
	})
	.options('nw-test', {
		describe: 'Runs only the specified test. By default it will attempt to run all tests in the folder and its subfolders.'
	})
	.options('nw-group', {
		describe: 'Runs only the specified group of tests (subfolder). Tests are grouped by being placed in the same subfolder.'
	})
	.options('nw-verbose', {
		describe: 'Shows extended selenium command logging during the session'
	})
	.options('nw-skipgroup', {
		describe: 'Skip one or several (comma separated) group of tests.'
	})
	.options('nw-filter', {
		describe: 'Specify a filter (glob expression) as the file name format to use when loading the test files.'
	})
	.options('nw-tags', {
		describe: 'Filter test modules by tags. Only tests that have the specified tags will be loaded.'
	});