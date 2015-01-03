var proxyquire = require("proxyquire");
var chai = require("chai");
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var sinon = require("sinon");


// -----------------------------------------------------------------
// 							stubs
// -----------------------------------------------------------------

var childPid = 4321;
var psextStub = {
	lookup: function (selector, cb) {
		cb(false, [{pid: childPid}]);
	}
};

// -----------------------------------------------------------------
// 							require
// -----------------------------------------------------------------


var MongoDb = proxyquire('../../lib/MongoDb', {
	'psext': psextStub
});

// -----------------------------------------------------------------
// 							tests
// -----------------------------------------------------------------


describe('MongoDb', function () {
	'use strict';

	before(function () {
		
		// when mongoDb exits, it would call through to killAllChildren
		// and try to kill a process with id: childPid
		// so we mock the mongo.killAllChildren method
		MongoDb.prototype.killAllChildren = sinon.spy();
	});

	var meteorPid = 1234;

	it('exists', function () {
		expect(MongoDb).to.be.ok;
	});

	it('finds children', function () {
		var mongo = new MongoDb(meteorPid);

		expect(mongo.children).to.have.length(1);
	});

	it('is not killed in the beginning', function () {
		var mongo = new MongoDb(meteorPid);

		expect(mongo.killed).to.be.false;
	});
});