const deletion = require('../features/messageDelete/deletion.js');

exports.check = deletion.purgeCache;

exports.interval = 60;
