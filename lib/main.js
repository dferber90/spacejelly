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
		| Start Selenium Server (in parallel to Meteor for increased speed?) ✓
	
	Test
		Start Nightwatch ✓

	Report
		Exit using the correct exit code

*/

var spacejelly = new Spacejelly(argv.nw, argv.meteor);

spacejelly.on('setup.complete', function () {
	log.debug('main.setup.complete');
	
	spacejelly.runTests();
});

spacejelly.on('tests.complete', function (result) {
	log.debug('main.tests.complete.');

	spacejelly.exit(result);
});

spacejelly.readConfigs().setup();
