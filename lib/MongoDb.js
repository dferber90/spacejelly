/*
	Heavily influenced by
	https://github.com/practicalmeteor/spacejam/blob/master/src/MeteorMongodb.coffee
 */

require('./log');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('underscore');
var ps = require('psext');

var MongoDb = function (meteorPid) {
	var self = this;

	this.meteorPid = meteorPid;
	this.killed = false;
	this.exitCode = 1;

	log.debug('MongoDb', meteorPid);

	process.on('exit', function (code) {
		log.debug('MongoDb process exit', code);
		self.exitCode = code;
		self.killAllChildren();
	});

	this.findAllChildren();
};

util.inherits(MongoDb, EventEmitter);

_.extend(MongoDb.prototype, {
	findAllChildren: function () {
		var self = this;

		var selector = {
			command: 'mongod',
			psargs: '-l',
			ppid: this.meteorPid
		};

		ps.lookup(selector, function (error, resultList) {
			self.children = resultList;

			if (error) {
				log.warn("Spacejelly: Couldn't finde any mongod children.");
			} else if (resultList.length > 1) {
				log.warn("Spacejelly: Found more than one mongod child.", resultList);
			} else {
				log.trace("Found mongod child with pid", resultList[0].pid);
			}
		});
	},

	killAllChildren: function () {
		if (this.killed) return;

		this.killed = true;

		this.children.forEach(function (child) {
			log.debug("MongoDb.children.kill", child.pid);
			process.kill(child.pid, "SIGTERM");
		});

		// TODO try harder to kill childs (see spacejam)
	}
});


module.exports = MongoDb;
