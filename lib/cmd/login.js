module.exports = function () {
    const chalk = require('chalk');
    var sep = "/";
    var path = require('path');
    var os = require('os');
    var fs = require('fs');
    var crypto = require('crypto');
    var util = require('../util');
    var root = os.homedir() + sep + 'omneedia';
    if (!fs.existsSync(root)) fs.mkdirSync(root);
    var request = require('request');
    var Request = {};
    if (global.CFG.current.proxy) var Request = request.defaults({
        'proxy': global.CFG.current.proxy
    });
    else Request = request;
    if (fs.existsSync(root + path.sep + '.login')) {
        console.log('  You are already logged in (' + chalk.bold(global.CFG.manager.split('://')[1].split('/')[0]) + ').\n');
        return;
    };
    var sandbox = "https://auth.omneedia.com/login";
    if (process.argv[3]) {
        sandbox = "https://" + process.argv[3] + "/login"
    };
    var inquirer = require('inquirer');
    var questions = [{
        type: 'input',
        name: 'userid',
        message: '\tUser ID:'
    }, {
        type: 'password',
        name: 'password',
        message: '\tPassword:'
    }];
    inquirer.prompt(questions).then(function (answers) {
        var shasum = crypto.createHash('sha512');
        shasum.update(answers.password);

        Request({
            url: sandbox,
            form: {
                l: answers.userid,
                p: shasum.digest('hex')
            },
            headers: {
                'secret': global.CFG.secret
            },
            method: "post",
            encoding: null
        }, function (err, resp, body) {

            if (err) {
                util.error('Service unavailable. Please try again later.');
                return;
            };
            try {
                var response = JSON.parse(body.toString('utf-8'));
            } catch (e) {
                util.error('Service unavailable. Please try again later.');
            }


            if (response.success) {


                fs.writeFile(root + path.sep + '.login', new Buffer(global.CFG.secret + response.pid).toString('base64'), function (e) {
                    global.CFG.username = response.name;
                    global.CFG.mail = response.mail;

                    global.CFG.manager = response.manager;
                    global.CFG.auth = response.auth;
                    global.CFG.console = response.console;

                    fs.writeFile(root + sep + '.config', JSON.stringify(global.CFG), function () {
                        fs.stat(root + sep + '.ssh', function (e, r) {
                            if (e) {

                                if (err) return util.error('Something went wrong: ' + err);

                                var pair = response.ssh;

                                fs.writeFile(root + sep + '.ssh', JSON.stringify(pair), function (e) {
                                    fs.writeFile(root + sep + '.ssh.public', pair.public, function (e) {
                                        fs.writeFile(root + sep + '.ssh.private', pair.private, function (e) {
                                            console.log('\n\t[ OK ] Access granted!\n'.green);
                                            /*console.log('-- Your public ssh key --------\n'.yellow);
                                            console.log(pair.public);
                                            console.log('-------------------------------\n'.yellow);
                                            console.log('\n');*/
                                        });
                                    });
                                });

                            } else console.log('\n\t[ OK ] Access granted!\n'.green);

                        });
                    });
                });
            } else {
                util.error('Login failed.')
            }
        });
    });

}();