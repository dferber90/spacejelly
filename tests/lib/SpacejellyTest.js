var proxyquire = require("proxyquire");
var chai = require("chai");
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var sinon = require("sinon");


// -----------------------------------------------------------------
// 							stubs
// -----------------------------------------------------------------


var tmpStub = function (fileName, options) {
	expect(fileName, "file name").to.be.a('string');
	expect(options, "options").to.be.an('object');

	return 'tmp/mock/nightwatch.json';
};

// -----------------------------------------------------------------
// 							require
// -----------------------------------------------------------------


var Spacejelly = proxyquire('../../lib/Spacejelly', {
	'./util/tmp': tmpStub
});


// -----------------------------------------------------------------
// 							tests
// -----------------------------------------------------------------

describe('Spacejelly', function () {
	'use strict';

	var spacejelly;

	beforeEach(function () {
		spacejelly = new Spacejelly();
	});

	it('exists', function () {
		expect(Spacejelly).to.be.ok;
	});

	it('is not ready on startup', function () {
		expect(spacejelly.ready).to.be.false;
	});

	it('is not stopped on startup', function () {
		expect(spacejelly.stopped).to.be.false;
	});

	describe('init', function () {
		
		it('loads the default config, if no path is specified', function () {

			spacejelly.init();
			expect(spacejelly.options, 'options').to.be.an('object');
			expect(spacejelly.options.startSelenium, 'startSelenium').to.be.true;
			expect(spacejelly.options.replaceSeleniumPath, 'replaceSeleniumPath').to.be.true;
			expect(spacejelly.options.meteor, 'meteor').to.be.an('object');
			expect(spacejelly.options.nightwatch, 'nightwatch').to.be.an('object');
			expect(spacejelly.options.nightwatch.selenium.server_path).to.be.a('string').that.is.not.empty;
		});

		it('loads a specified config file', function () {
			var source = '../data/spacejelly.nightwatch.json';
			spacejelly = new Spacejelly({config: source});

			expect(spacejelly.args.config).to.equal(source);
		});
		
		
	});
});