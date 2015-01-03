var proxyquire = require("proxyquire");
var chai = require("chai");
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var sinon = require("sinon");


// -----------------------------------------------------------------
// 							stubs
// -----------------------------------------------------------------


var childProcessStub = {
	spawn: function (cmd, seleniumArgs, runtimeOptions) {
		expect(cmd).to.be.a('string').that.is.ok;
		expect(seleniumArgs).to.be.an('array');
		expect(runtimeOptions).to.be.an('object');

		return {
			stderr: {
				on: function () {}
			},
			stdout: {
				on: function () {}
			},
			on: function () {},
			kill: function () {}
		};
	}
};


// -----------------------------------------------------------------
// 							require
// -----------------------------------------------------------------

var Selenium = proxyquire('../../lib/Selenium', {
	'child_process': childProcessStub
});

// -----------------------------------------------------------------
// 							tests
// -----------------------------------------------------------------


describe('Selenium', function () {
	'use strict';

	var selenium;

	// avoid warning of listeners, because we create so many selenium-objects here
	// (node) warning: possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit.
	process.setMaxListeners(99);

	beforeEach(function () {
		selenium = new Selenium();
	});

	it('exists', function () {
		expect(Selenium).to.be.ok;
	});

	it('has default options', function () {
		expect(selenium.options).to.be.an('object');
		expect(selenium.options.start_process).to.be.false;
		expect(selenium.options.server_path).to.be.false;
		expect(selenium.options.log_path).to.be.a('string').that.is.empty;
		expect(selenium.options.host).to.be.a('string').that.is.not.empty;
		expect(selenium.options.port).to.be.a('number').that.is.ok;
		expect(selenium.options.cli_args).to.be.an('object').that.is.ok;
		expect(selenium.options.seleniumReadyText).to.be.a('string').that.is.not.empty;
	});

	it('accepts options', function () {
		var options = {
			"start_process": true,
			"server_path": 'path/to/selenium-server.jar',
			"log_path": "./log/here",
			"host": "localhost",
			"port": 8888,
			"cli_args": {
				"webdriver.chrome.driver" : "foo"
			},
			"seleniumReadyText": "foobaz"
		};

		selenium = new Selenium(options);

		expect(selenium.options).to.equal(options);
		expect(selenium.options.start_process).to.be.true;
		expect(selenium.options.server_path).to.equal(options.server_path);
		expect(selenium.options.log_path).to.equal(options.log_path);
		expect(selenium.options.host).to.equal(options.host);
		expect(selenium.options.cli_args).to.equal(options.cli_args);
		expect(selenium.options.cli_args['webdriver.chrome.driver']).to.equal(options.cli_args['webdriver.chrome.driver']);
		expect(selenium.options.seleniumReadyText).to.equal(options.seleniumReadyText);
	});

	it('is not stopped on creation', function () {
		expect(selenium.stopped).to.be.false;
	});

	it('is not ready on creation', function () {
		expect(selenium.stopped).to.be.false;
	});
	
	

	describe('Methods', function () {

		describe('start', function () {
			
			it('spawns a child process', function () {

				var server_path = 'path/to/selenium.jar';
				selenium = new Selenium({server_path: server_path});
				

				sinon.spy(childProcessStub, 'spawn');

				selenium.start();
				expect(childProcessStub.spawn).to.have.been.calledWith("java");
			});
			
		});

		describe('getSeleniumArgs', function () {
			
			it('returns an array', function () {
				expect(selenium.getSeleniumArgs()).to.be.an('array');
			});
			
			it('has the required selenium options', function () {
				selenium = new Selenium({server_path: '/path/to/selenium-server.jar'});
				var args = selenium.getSeleniumArgs();

				expect(args).to.have.length(6);
				expect(args[0]).to.equal('-jar');
				expect(args[1]).to.be.a('string').that.is.not.empty;
				expect(args[2]).to.equal('-host');
				expect(args[3]).to.be.a('string').that.is.not.empty;
				expect(args[4]).to.contain('-port');
				expect(args[5]).to.be.a('number');
			});
		});

		describe('getRuntimeOptions', function () {
			
			it('returns an object', function () {
				expect(selenium.getRuntimeOptions()).to.be.an('object');
			});

			it('has the required keys', function () {
				var options = selenium.getRuntimeOptions();

				expect(options.cwd).to.be.a('string').that.is.not.empty;
				expect(options.env).to.be.an('object').that.is.not.empty;
				expect(options.detached).to.be.false;
			});			
		});

		describe('stop', function () {

			it('emits the code it was called with', function () {
				
				var code = 3;
				sinon.spy(selenium, 'emit');

				selenium.stop(code);
				expect(selenium.emit).to.have.been.calledWith('stop', code);
			});

			it('does not emit "stop" again, if selenium is already stopped', function () {

				sinon.spy(selenium, 'emit');
				selenium.stop();
				selenium.stop();

				expect(selenium.emit).to.have.been.calledOnce;
			});

			it('kills the child process', function () {
				selenium.childProcess = {
					kill: sinon.spy()
				};

				selenium.stop();

				expect(selenium.childProcess.kill).to.have.been.calledOnce;
			});
			
		});
	});
});
