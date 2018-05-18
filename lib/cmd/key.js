module.exports = function () {

    var fs = require('fs');
    var path = require('path');
    const chalk = require('chalk');
    var util = require('../util');
    var sep = "/";
    var root = require('os').homedir() + sep + 'omneedia';
    if (!fs.existsSync(root)) fs.mkdirSync(root);

    fs.readFile(root + sep + '.ssh', function (e, r) {
        if (e) {
            return util.error('You are not logged in!');
        } else {
            var key = JSON.parse(r.toString('utf-8'));
            console.log('-- Your public ssh key --------\n'.yellow);
            console.log(key.public);
            console.log('-------------------------------\n'.yellow);
            console.log('\n');
        }
    });

}();