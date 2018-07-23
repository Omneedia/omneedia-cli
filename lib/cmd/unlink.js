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

    console.log(chalk.bold("Unlink your project."));
    console.log('You are about to unlink your project. You can\'t undo this action.')
    console.log('____________________\n')

    require('../globals');
    var root = require('os').homedir() + sep + 'omneedia';
    var dir = global.PROJECT_HOME;

    if (!fs.existsSync(root)) fs.mkdirSync(root);
    var Console = global.CFG.console;
    var manager = global.CFG.manager;

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

                api('unlink', {
                    manifest: JSON.stringify(manifest)
                }, function (response) {
                    if (response.err) {
                        if (response.err == "TASK_LINKED") {
                            var msg = chalk.red("[ ERR ]");
                            msg += "\tYou can't unlink a project already used in tasks.\n";
                            return console.log(msg);
                        } else {
                            var msg = chalk.red("[ ERR ]");
                            msg += "\tThis project is not linked.\n";
                            return console.log(msg);
                        }
                    } else {
                        inquirer.prompt([{
                            type: 'confirm',
                            name: "unlinkit",
                            default: false,
                            message: "Are you sure to unlink your project ?"
                        }]).then(answers => {
                            if (answers.unlinkit) {
                                api('unlink', {
                                    manifest: JSON.stringify(manifest),
                                    confirm: "ok"
                                }, function (response) {
                                    var msg = chalk.green("\n[ OK ]");
                                    msg += "\tThis project has been unlinked.\n";
                                    console.log(msg);
                                    /*inquirer.prompt([{
                                        type: 'confirm',
                                        name: "delit",
                                        default: false,
                                        message: "Do you want to delete repository ?"
                                    }]).then(answers => {
                                        if (answers.delit) {
                                            api('del/repository', {
                                                git: manifest.git
                                            }, function (response) {
                                                console.log(response);
                                            });
                                        } else console.log('Done.');
                                    });*/
                                    return
                                });
                            }
                        });
                    }
                });

            }
        })
    });


}();