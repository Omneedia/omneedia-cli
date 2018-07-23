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
    var inquirer = require('inquirer');
    const terminalLink = require('terminal-link');

    require('../globals');
    var root = require('os').homedir() + sep + 'omneedia';
    var dir = global.PROJECT_HOME;

    if (!fs.existsSync(root)) fs.mkdirSync(root);
    var Console = global.CFG.console;
    var manager = global.CFG.manager;

    const LINK = terminalLink('omneedia console', Console);

    fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {
        if (e) util.error("Can't find app.manifest ... Must be run inside your project root.");
        var manifest = JSON.parse(r.toString('utf-8'));

        function api(api, obj, cb) {
            var request = require('request');
            var Request = {};
            if (global.CFG.current.proxy) var Request = request.defaults({
                'proxy': global.CFG.current.proxy
            });
            else Request = request;
            Request({
                url: manager + 'api/' + api,
                form: obj,
                headers: {
                    'payload': global.CFG.PID
                },
                method: "post",
                encoding: null
            }, function (err, resp, body) {
                if (err) return util.error('Service unavailable');
                try {
                    var response = JSON.parse(body);
                    cb(response);
                } catch (e) {
                    util.error('Service unavailable');
                }
            });
        };

        fs.stat(root + sep + '.login', function (e) {
            if (e) util.error('You are not logged in!');
            else {
                console.log(chalk.bold('\t- Stopping sandbox...'));
                var PROVIDER = "";
                var USER = "";
                api('down', {
                    uid: manifest.uid
                }, function (response) {
                    if (response.err) {
                        var msg = chalk.red("[ ERR ]");
                        msg += "\tThe sandbox isn't running.\n";
                        return console.log(msg);
                    } else {
                        var msg = chalk.green("[ OK ]");
                        msg += "\tSandbox is down.\n";
                        return console.log(msg);
                    }
                });

            }
        })
    });


}();