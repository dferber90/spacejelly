/*
	Heavily influenced by
	https://github.com/practicalmeteor/spacejam/blob/master/src/MeteorMongodb.coffee
 */

require('./log');
var _ = require('underscore');
var ps = require('psext');

var MongoDb = function (meteorPid) {
	log.debug('MongoDb.constructor()');
	var self = this;

	this.meteorPid = meteorPid;
	this.killed = false;

	log.trace('MongoDb.meteorPid', meteorPid);

	process.on('exit', function (code) {
		log.debug('MongoDb.process.exit', code);
		self.killAllChildren();
	});

	this.findAllChildren();
};

_.extend(MongoDb.prototype, {
	findAllChildren: function () {
		log.debug('MongoDb.findAllChildren()');
		var self = this;

		var selector = {
			command: 'mongod',
			psargs: '-l',
			ppid: this.meteorPid
		};

		ps.lookup(selector, function (error, resultList) {
			self.children = resultList;

			if (error) {
				log.warn("spacejelly: Couldn't finde any mongod children.");
			} else if (resultList.length > 1) {
				log.warn("spacejelly: Found more than one mongod child.", resultList);
			} else {
				log.trace("MongoDb.findAllChildren -> found child:", resultList[0].pid);
			}
		});
	},

	killAllChildren: function () {
		log.debug('MongoDb.killAllChildren()');
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
