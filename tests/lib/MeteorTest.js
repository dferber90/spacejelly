var proxyquire = require("proxyquire");
var chai = require("chai");
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var sinon = require("sinon");


var childProcessStub = {
	spawn: function (cmd, meteorArgs, runtimeOptions) {
		expect(cmd).to.be.a('string').that.is.ok;
		expect(meteorArgs).to.be.an('array');
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

var Meteor = proxyquire('../../lib/Meteor', {
	'child_process': childProcessStub
});

describe('Meteor', function () {
	'use strict';

	it('exists', function () {
		expect(Meteor).to.exist;
		expect(Meteor).to.be.ok;
	});

	it('is a constructor', function () {
		expect(new Meteor()).to.be.ok;
		// expect(Meteor).to.be.an.instanceOf(Meteor);
	});

	it('has prototypal methods', function () {
		var meteor = new Meteor();

		expect(meteor).to.have.property('start');
		expect(meteor).to.have.property('stop');
		expect(meteor).to.have.property('getRuntimeOptions');
		expect(meteor).to.have.property('getMeteorArgs');
	});
	
	
	it('has default options', function () {
		var meteor = new Meteor();

		expect(meteor.options).to.have.property('dir');
		expect(meteor.options).to.have.property('release');
		expect(meteor.options).to.have.property('port');
		expect(meteor.options).to.have.property('production');
		expect(meteor.options).to.have.property('settings');
		expect(meteor.options).to.have.property('mongoUrl');
		expect(meteor.options).to.have.property('meteorReadyText');
		expect(meteor.options).to.have.property('meteorMongoDbReadyText');
		expect(meteor.options).to.have.property('meteorErrorText');
	});


	describe('start', function () {
		'use strict';
	
		it('emits "start"', function (done) {
			var meteor = new Meteor();

			var errTimeout = setTimeout(function () {
				expect(true, 'did not emit "start"').to.be.false;
				done();
			}, 300);

			meteor.on('start', function () {
				clearTimeout(errTimeout);
				expect(true).to.be.true;
				done();
			});

			meteor.start();
		});

		it('spawns a child process', function () {
			var meteor = new Meteor();

			sinon.spy(childProcessStub, 'spawn');
			meteor.start();
			expect(childProcessStub.spawn).to.have.been.calledOnce;
			expect(childProcessStub.spawn).to.have.been.calledWith("meteor");
		});
		
		
	});

	describe('stop', function () {
		'use strict';
	
		var killStub = {
			kill: function () {}
		};

		it('kills the childProcess if it was started', function () {
			var meteor = new Meteor();
			meteor.ready = true;

			// stub and spy
			meteor.childProcess = killStub;
			sinon.spy(meteor.childProcess, 'kill');

			meteor.stop();
			expect(meteor.childProcess.kill).to.have.been.called;
		});

		it('sets the "stopped" flag', function () {
			var meteor = new Meteor();

			// stub
			meteor.childProcess = killStub;

			meteor.stop();
			expect(meteor.stopped).to.be.true;
		});

		it('emits "stop"', function (done) {
			var meteor = new Meteor();
			meteor.childProcess = killStub;

			var errTimeout = setTimeout(function () {
				expect(false, 'did not emit "stop"').to.be.true;
				done();
			}, 300);


			meteor.on('stop', function () {
				clearTimeout(errTimeout);
				expect(true).to.be.true;
				done();
			});

			meteor.stop();
		});
		
		
	});

	describe('getRuntimeOptions', function () {
		'use strict';
	
		it('gets the environment', function () {
			var meteor = new Meteor();
			var runtimeOptions = meteor.getRuntimeOptions();

			expect(runtimeOptions).to.have.property('cwd');
			expect(runtimeOptions.cwd).to.be.a('string').that.is.ok;

			expect(runtimeOptions).to.have.property('env');
			expect(runtimeOptions.env).to.be.an('object').that.is.ok;

			expect(runtimeOptions).to.have.property('detached');
			expect(runtimeOptions.detached).to.be.false;
		});

		it('has env.mongoUrl if one is set', function () {
			var mongoUrl = 'mongo://url';
			var meteor = new Meteor({mongoUrl: mongoUrl});
			var runtimeOptions = meteor.getRuntimeOptions();

			expect(runtimeOptions).to.have.property('env');
			expect(runtimeOptions.env).to.have.property('MONGO_URL');
			expect(runtimeOptions.env.MONGO_URL).to.equal(mongoUrl);
		});
		
		it('does not have env.mongoUrl if none is set', function () {
			var tmp = process.env.MONGO_URL;
			process.env.MONGO_URL = 'should-be-deleted';

			var meteor = new Meteor();
			var runtimeOptions = meteor.getRuntimeOptions();

			expect(runtimeOptions.env).not.to.have.property('MONGO_URL');
			process.env.MONGO_URL = tmp; // restore MONGO_URL in case it was set
		});
		
		
	});

	describe('getMeteorArgs', function () {
		'use strict';
	
		it('with default options', function () {
			var meteor = new Meteor();
			var args = meteor.getMeteorArgs();

			expect(args).not.to.be.empty;
			expect(args).to.have.length(2);
			expect(args[0]).to.equal('--port');
			expect(args[1]).to.equal(4096);
		});

		it('with release', function () {
			var release = 'awesome-release';
			var meteor = new Meteor({release: release});
			var args = meteor.getMeteorArgs();

			expect(args).to.have.length(4);
			expect(args).to.contain('--release');
			expect(args).to.contain(release);
		});
		

		it('with port', function () {
			var port = 4000;
			var meteor = new Meteor({port: port});
			var args = meteor.getMeteorArgs();

			expect(args).to.have.length(2);
			expect(args[0]).to.equal('--port');
			expect(args[1]).to.equal(port);
		});
		
		it('in production mode', function () {
			var meteor = new Meteor({production: true});
			var args = meteor.getMeteorArgs();

			expect(args).to.have.length(3);
			expect(args[2]).to.equal('--production');
		});
		
		it('with settings file', function () {
			var settings = 'settings.json';
			var meteor = new Meteor({settings: settings});
			var args = meteor.getMeteorArgs();

			expect(args).to.have.length(4);
			expect(args[2]).to.equal('--settings');
			expect(args[3]).to.equal(settings);
		});
	});
});