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
    var request = require('request');
    var Request = {};
    if (global.CFG.current.proxy) var Request = request.defaults({
        'proxy': global.CFG.current.proxy
    });
    else Request = request;
    if (fs.existsSync(root + path.sep + '.login')) {
        console.log('  You are already logged in.\n'.yellow);
        return;
    };
    var sandbox = "https://auth.omneedia.com/login";
    if (global.CFG.current['deploy.host']) var sandbox = global.CFG.current['deploy.host'] + "/login";
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
        var crypto = require('crypto'),
            shasum = crypto.createHash('sha512');
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
                console.log('\n\t!!! Service unavailable. Please try again later.\n'.red);
                return;
            };
            var response = JSON.parse(body.toString('utf-8'));
            if (response.success) {
                fs.writeFile(root + path.sep + '.login', new Buffer(global.CFG.secret + response.pid).toString('base64'), function (e) {
                    global.CFG.username = response.name;
                    global.CFG.mail = response.mail;
                    fs.writeFile(root + sep + '.config', JSON.stringify(global.CFG), function () {
                        fs.stat(root + sep + '.ssh', function (e, r) {
                            if (e) {
                                var keygen = require('ssh-keygen');

                                keygen({

                                    comment: response.mail,
                                    //password: password,
                                    read: true
                                }, function (err, out) {
                                    if (err) return util.error('Something went wrong: ' + err);

                                    var pair = {
                                        private: out.key,
                                        public: out.pubKey
                                    };
                                    console.log(pair);
                                    fs.writeFile(root + sep + '.ssh', JSON.stringify(pair), function (e) {
                                        fs.writeFile(root + sep + '.ssh.private', out.key, function (e) {
                                            fs.writeFile(root + sep + '.ssh.public', out.pubKey, function (e) {
                                                console.log('\n\t[ OK ] Access granted!\n'.green);
                                            });
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