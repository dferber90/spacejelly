var proxyquire = require("proxyquire");
var chai = require("chai");
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var sinon = require("sinon");


// -----------------------------------------------------------------
// 							stubs
// -----------------------------------------------------------------

var NightwatchStub = {
	runner: sinon.spy()
};

// -----------------------------------------------------------------
// 							require
// -----------------------------------------------------------------

var Nw = proxyquire('../../lib/Nw', {
	'nightwatch/lib/index.js': NightwatchStub
});

// -----------------------------------------------------------------
// 							tests
// -----------------------------------------------------------------

describe('Nw', function () {
	'use strict';

	it('exists', function () {
		expect(Nw).to.be.ok;
	});

	it('saves the arguments', function () {
		var configPath = 'path/to/cfg.js',
			testSettings = { foo: 'bar' },
			cliOptions = { foo2: 'baz' };

		var nw = new Nw(configPath, testSettings, cliOptions);

		expect(nw.configPath).to.equal(configPath);
		expect(nw.testSettings).to.equal(testSettings);
		expect(nw.cliOptions).to.equal(cliOptions);
	});
	
	describe('Methods', function () {
		'use strict';
		
		var nw,
			configPath = 'config/path/nightwatch.json';

		beforeEach(function () {
			nw = new Nw(configPath);
		});
	
		describe('start', function () {
		
			it('starts nightwatch', function () {
				nw.start();

				expect(NightwatchStub.runner).to.have.been.called;
				expect(nw.nightwatch).not.to.be.false; // is actually 'undefined', because of stub
			});	
		});

		describe('getCommandLineOptions', function () {

			it('has default env', function () {
				var cliOptions = nw.getCommandLineOptions();

				expect(cliOptions.env).to.equal('default');
			});

			it('can overwrite default env', function () {
				var otherEnv = 'otherEnv';
				nw = new Nw(configPath, {}, {env: otherEnv});

				var cliOptions = nw.getCommandLineOptions();
				expect(cliOptions.env).to.equal(otherEnv);
			});
			
			it('forces the path', function () {
				var cliOptions = nw.getCommandLineOptions();

				expect(cliOptions.config).to.equal(configPath);
			});
			
		});


		describe('getTestsCompleteCallback', function () {

			it('returns a function', function () {
				var cb = nw.getTestsCompleteCallback();

				expect(cb).to.be.a('function');
			});

			it('returns a function that calls emit with "completed" with corrct value', function () {
				var cb = nw.getTestsCompleteCallback();

				sinon.spy(nw, 'emit');
				var result = 'result';
				cb(result);
				expect(nw.emit).to.have.been.calledWith('completed', result);
			});
		});


		describe('getSettings', function () {
			
			it('returns an object', function () {
				var settings = nw.getSettings();

				expect(settings).to.be.an('object');
			});

			it('has defaults', function () {
				var settings = nw.getSettings();

				expect(settings.desiredCapabilities, 'desiredCapabilites').to.be.an('object');
				expect(settings.desiredCapabilities.browserName).to.equal('phantomjs');
				expect(settings.desiredCapabilities.javascriptEnabled).to.be.true;
				expect(settings.desiredCapabilities.acceptSslCerts).to.be.true;
				expect(settings.desiredCapabilities['phantomjs.binary.path']).to.be.a('string').that.is.ok;
			});
			
			
			it('accepts additional settings', function () {
				var globals = {foo: 'bar'};

				nw = new Nw(configPath, {globals: globals});
				var settings = nw.getSettings();

				expect(settings.globals).to.equal(globals);
			});
			
			it('overwrites the defaults', function () {
				var browserName = 'chrome',
					testSettings = {
						'desiredCapabilites': {
							browserName: browserName
						}
					};

				nw = new Nw(configPath, testSettings);
				var settings = nw.getSettings();

				expect(settings.desiredCapabilites.browserName).to.equal(browserName);
			});
		});


	});
});