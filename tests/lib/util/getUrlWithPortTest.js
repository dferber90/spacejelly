
var chai = require("chai");
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);



// -----------------------------------------------------------------
// 							require
// -----------------------------------------------------------------

var getUrlWithPort = require('../../../lib/util/getUrlWithPort');


// -----------------------------------------------------------------
// 							tests
// -----------------------------------------------------------------


describe('getUrlWithPort', function () {
	'use strict';

	var url = 'http://localhost';

	it('should be a function', function () {
		expect(getUrlWithPort).to.be.a('function');
	});


	describe('should throw an AssertionError when called with', function () {
		'use strict';

		it('no arguments', function () {
			expect(getUrlWithPort).to.throw(chai.AssertionError);
		});

		it('empty url', function () {
			expect(getUrlWithPort.bind(undefined, '')).to.throw(chai.AssertionError);
		});

		it('invalid port', function () {
			var url = 'http://localhost';
			expect(getUrlWithPort.bind(undefined, url, 'abcd')).to.throw(chai.AssertionError);
		});
	});


	describe('should work without port and', function () {
		'use strict';

		it('no trailing slash', function () {
			expect(getUrlWithPort(url)).to.equal(url + '/');
		});

		it('a trailing slash', function () {
			var trailingUrl = url + '/';
			expect(getUrlWithPort(trailingUrl)).to.equal(trailingUrl);
		});
	});

	describe('should work with a', function () {
		'use strict';

		it('numeric port', function () {
			expect(getUrlWithPort(url, 80)).to.equal('http://localhost:80/');
		});
		
		it('a string port', function () {
			expect(getUrlWithPort(url, "80")).to.equal('http://localhost:80/');
		});
	});
});