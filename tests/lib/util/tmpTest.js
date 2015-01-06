var fs = require('fs');
var proxyquire = require("proxyquire");
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);


// -----------------------------------------------------------------
// 							require
// -----------------------------------------------------------------

var tmp = require('../../../lib/util/tmp');


// -----------------------------------------------------------------
// 							tests
// -----------------------------------------------------------------


describe('tmp', function () {
	'use strict';

	var fileName = 'testfile.js',
		obj = {foo: 'bar'},
		objAsStr = JSON.stringify(obj, null, 4);


	var f; // the created tmp file

	it('creates a file', function () {
		f = tmp.create(fileName, obj);
		expect(fs.existsSync(f)).to.be.true;
	});

	it('returns a path', function () {
		expect(f).to.be.a('string').that.is.not.empty;
	});

	it('writes the contents', function () {
		expect(fs.readFileSync(f, {encoding: 'utf8'})).to.equal(objAsStr);
	});

	it('removes it afterwards', function () {
		tmp.remove(f);
		expect(fs.existsSync(f)).to.be.false;
	});
});