var proxyquire = require("proxyquire");
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);




// -----------------------------------------------------------------
// 							stubs
// -----------------------------------------------------------------

var tempWriteStub = {
	sync: function (contents, fileName) {
		expect(contents).to.be.a('string').that.is.ok;
		expect(fileName).to.be.a('string').that.is.ok;

		return '/tmp/xyz/' + fileName;
	}
};


// -----------------------------------------------------------------
// 							require
// -----------------------------------------------------------------

var createTmpJSONFileFromObject = proxyquire('../../../lib/util/createTmpJSONFileFromObject', {
	'temp-write': tempWriteStub
});


// -----------------------------------------------------------------
// 							tests
// -----------------------------------------------------------------


describe('createTmpJSONFileFromObject', function () {
	'use strict';

	var fileName = 'testfile.js',
		obj = {foo: 'bar'},
		objAsStr = JSON.stringify(obj, null, 4);

	beforeEach(function () {
		sinon.spy(tempWriteStub, 'sync');
	});

	afterEach(function () {
		tempWriteStub.sync.restore();
	});

	it('returns a string', function () {
		
		expect(createTmpJSONFileFromObject(fileName, obj)).to.be.a('string').that.is.ok;
	});
	

	it('calls tempWrite with correct parameters', function () {

		createTmpJSONFileFromObject(fileName, obj);
		expect(tempWriteStub.sync).to.have.been.calledOnce;
		expect(tempWriteStub.sync).to.have.been.calledWith(objAsStr, fileName);
	});
	


});