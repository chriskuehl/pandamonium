'use strict';

var create = require('./create').create,
  get = require('./get').get,
  list = require('./list').list,
  parseArgs = require('minimist');

function usage () {
  console.log('Usage: pm checks COMMAND [OPTIONS]\n\n' +
    '\twhere COMMAND can be one of: (create|help)');
}

module.exports = {
  get: get,
  list: list,
  runCommand: function (argv, cb) {
    var parsed = parseArgs(argv),
      command = parsed._[0],
      count,
      entityId,
      spread;

    if (command === 'help') {
      usage();
      process.nextTick(cb);
    } else if (command === 'create') {
      count = parsed.n || parsed.count || 1;
      entityId = parsed.e || parsed.entity;
      spread = !!(parsed.s || parsed.spread);
      create({
        count: count,
        entityId: entityId,
        spread: spread
      }, cb);
    } else {
      usage();
      process.nextTick(function () {
        cb(new Error('Unrecognized command'));
      });
    }
  }
};
