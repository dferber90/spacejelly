var fs = require('fs');
var proxyquire = require("proxyquire");
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);


var loadConfig;

describe('loadConfig', function () {
	'use strict';

	var fsExistsSyncStub,
		fsReadFileSyncStub,
		jsFileStub = true;

	before(function () {
		fsExistsSyncStub = sinon.stub(fs, 'existsSync');

		loadConfig = proxyquire('../../../lib/util/loadConfig', {
			fs: {
				existsSync: fsExistsSyncStub
			}
		});
	});

	after(function () {
		fs.existsSync.restore();
	});

	it('exists', function () {
		expect(loadConfig, 'loadConfig').to.be.ok;
	});
	

	it('returns false if file is not found', function () {
		var nonExistantFile = './non-existing-file.js';
		fsExistsSyncStub.withArgs(nonExistantFile).returns(false);

		expect(loadConfig(nonExistantFile)).to.be.false;
	});
	
});