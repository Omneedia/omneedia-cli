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
                var PROVIDER = "";
                var USER = "";
                console.log(chalk.bold('\t- Connecting to nodes manager...\n'))
                api('isUP', {
                    uid: manifest.uid
                }, function (response) {
                    if (response.err) {
                        var info = "[ ERR ] ".red +
                            "\tThis project is not linked.\n";
                        return console.log(info);
                    };
                    if (response.total == 0) {
                        console.log(chalk.bold('\t- Allocating node'));

                        var socket = require('socket.io-client')(manager, {
                            query: "payload=" + global.CFG.PID
                        });

                        socket.on('connect', function () {

                            socket.emit('#api', {
                                cmd: "up",
                                uid: manifest.uid
                            });

                            socket.on('#up', function (response) {

                                if (response.starting) {
                                    return console.log(chalk.bold('\t- Booting kernel'));
                                };

                                if (response.online) {
                                    console.log(chalk.green.bold('[ OK ]\t') + "Your sandbox is up and running at " + chalk.bold("https://" + manifest.uid.toLowerCase() + "-sandbox.omneedia.com/\n"));
                                    socket.disconnect();
                                    var launcher = require('launch-browser');
                                    launcher('https://' + manifest.uid + '-sandbox.omneedia.com/', {
                                        browser: ['chrome', 'firefox', 'safari']
                                    }, function (e, browser) {
                                        if (e) return console.log(e);
                                        browser.on('stop', function (code) {
                                            console.log('Browser closed with exit code:', code);
                                        });
                                    });
                                    return;
                                };

                                if (response.started) {
                                    console.log(chalk.bold('\t- Sandbox starting...\n'));
                                    return;
                                };

                                if (response.node == -1) {
                                    var info = "[ INFO ] ".green +
                                        " No more node available. Please try again later.\n".black;
                                    socket.disconnect();
                                    return console.log("\t" + info);
                                };

                                if (response.err) {
                                    if (response.err == "NO_MORE_NODE") {
                                        var info = "[ UPGRADE ] ".red +
                                            "  Limit plan exceeded. No more node available for your current plan.\n".black + "\t\t      Please upgrade your plan or switch off one or more sandbox(es).\n".black + "\t\t      Please visit " + LINK.yellow + "\n".black;
                                        socket.disconnect();
                                        return console.log("\t" + info);
                                    };
                                    if (response.err == "SERVICE_UNAVAILABLE") {
                                        var info = "[ INFO ] ".red +
                                            " Service unavailable. Please try again later.";
                                        socket.disconnect();
                                        return console.log("\t" + info);
                                    };
                                } else {
                                    console.log(chalk.bold('\t- Provisioning node'));
                                }

                            });
                            socket.on('disconnect', function () {
                                //console.log('\tdisconnected.');
                            });
                        });
                    } else {
                        var msg = chalk.red("[ ERR ]");
                        msg += "\tThis project has already been upped.\n";
                        return console.log(msg);
                    }
                });

            }
        })
    });


}();