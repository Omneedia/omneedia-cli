module.exports = function () {

    var fs = require('fs');
    var path = require('path');
    var sep = "/";
    var root = require('os').homedir() + sep + 'omneedia';
    if (!fs.existsSync(root)) fs.mkdirSync(root);

    fs.readFile(root + sep + '.ssh', function (e, r) {
        if (e) {
            return console.log('err');
        } else {
            var key = JSON.parse(r.toString('utf-8'));
            console.log(key.public);
        }
    });

}();