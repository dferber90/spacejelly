var argv = require('optimist').argv;


if (argv.help) {
	console.log("spacejelly help\n");
	console.log("Run nightwatch tests in Meteor projects. Simple.");
	return;
}
console.log("Hello " + argv.name);