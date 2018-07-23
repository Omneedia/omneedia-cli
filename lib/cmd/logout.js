module.exports = function () {
    var emojic = require('emojic');
    const chalk = require('chalk');
    var sep = "/";
    var path = require('path');
    var os = require('os');
    var fs = require('fs');
    var crypto = require('crypto');
    var util = require('../util');
    var root = os.homedir() + sep + 'omneedia';
    if (!fs.existsSync(root)) fs.mkdirSync(root);
    var sandbox = global.CFG.auth + '/logout';
    fs.stat(root + sep + '.login', function (e) {
        if (e) util.error('You are not logged in!');
        else {
            var request = require('request');
            var Request = {};
            if (global.CFG.current.proxy) var Request = request.defaults({
                'proxy': global.CFG.current.proxy
            });
            else Request = request;
            Request({
                url: sandbox,
                form: {},
                headers: {
                    'payload': global.CFG.PID
                },
                method: "post",
                encoding: null
            }, function (err, resp, body) {
                if (err) return util.error('Service unavailable');
                delete global.CFG.secret;
                delete global.CFG.username;
                delete global.CFG.mail;
                delete global.CFG.PID;
                delete global.CFG.manager;
                delete global.CFG.auth;
                delete global.CFG.console;
                fs.writeFile(root + sep + '.config', JSON.stringify(global.CFG, null, 4), function (e) {
                    fs.unlink(root + sep + '.login', function () {
                        fs.unlink(root + sep + '.ssh', function () {
                            fs.unlink(root + sep + '.ssh.private', function () {
                                fs.unlink(root + sep + '.ssh.public', function () {
                                    console.log('\n\t[ OK ] You are logged out!\n'.green);
                                });
                            });
                        });
                    })
                });
            });
        }
    })
}();