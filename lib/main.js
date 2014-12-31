require('./log');
var argv = require('optimist').argv;
var Spacejelly = require('./Spacejelly');



// -----------------------------------------------------------------
// 							Blueprint
// -----------------------------------------------------------------

/*

	Read Config
		| for Nightwatch (and save updated version to /tmp) ✓
		| for Selenium (selenium-part of nightwatch.json from /tmp) ✓
		| for Meteor ✓

	Prepare Testing (Setup)
		| Start Meteor ✓
		| Capture MongoDB Instance ✓
		| Start Selenium Server (in parallel to Meteor for increased speed?)
	
	Test
		Start Nightwatch

	Report
		Parse Logs of Nightwatch
		Exit using the correct exit code

*/

var spacejelly = new Spacejelly(argv.nw, argv.meteor);

spacejelly.readConfigs().setup();

spacejelly.on('setup.complete', function () {
	log.info('Spacejelly is ready for testing!');
	
	spacejelly.runTests();
});

spacejelly.on('tests.completed', function (result) {
	log.info('Spacejelly completed tests.');

	spacejelly.report(result);
	spacejelly.tearDown();
});
