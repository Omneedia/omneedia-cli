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

    require('../globals');
    var root = require('os').homedir() + sep + 'omneedia';
    var dir = global.PROJECT_HOME;

    if (!fs.existsSync(root)) fs.mkdirSync(root);
    var Console = "https://console.omneedia.com/";
    var manager = "https://manager.omneedia.com/";
    if (global.CFG.current['manager.host']) manager = global.CFG.current['manager.host'];
    if (global.CFG.current['console.host']) Console = global.CFG.current['console.host'];

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

                function set_namespace(m) {
                    fs.readFile(dir + '/' + manifest.icon.file, function (e, r) {
                        manifest.b64 = new Buffer(r).toString('base64');
                        var group = m.split(':')[1];
                        if (!group) group = "";
                        api('repo/create', {
                            provider: PROVIDER,
                            user: USER,
                            group: m.split(':')[1],
                            manifest: JSON.stringify(manifest),
                            repository: m + '/' + manifest.namespace + '.git'
                        }, function (response) {
                            manifest.git = m + '/' + manifest.namespace + '.git';
                            delete manifest.b64;
                            fs.writeFile(global.PROJECT_HOME + sep + 'app.manifest', JSON.stringify(manifest, null, 4), function (e) {
                                console.log('\n\t[ OK ] your project is linked!\n'.green);
                            })
                        });
                    })
                };

                function get_group(i) {
                    var obj = {};
                    if (i) obj.provider = i;
                    api('repo/groups', obj, function (response) {
                        USER = response.items[0];
                        if (response.items.length == 0) return util.error("Bad request");
                        if (response.items.length == 1) return set_namespace('git@' + response.name + '.com:' + response.items[0]);
                        inquirer.prompt([{
                            type: 'list',
                            name: "group",
                            message: "Choose your group to link your project",
                            choices: response.items
                        }]).then(answers => {
                            PROVIDER = response.name;
                            set_namespace('git@' + response.name + '.com:' + answers.group);
                        });
                    });
                };
                /*api('repo/publish',{},function(response) {

                });
                return;*/
                api('repo/list', {}, function (response) {
                    var choices = [];
                    var NO_REPO = '\n\t' + emojic.warning + '   You have not configured any repository yet for your account.\n\tPlease visit ' + Console.green + '\n';
                    for (var i = 0; i < response.length; i++) choices.push(response[i].repo_name);
                    if (response.length == 0) return console.log(NO_REPO.yellow);
                    if (response.length == 1) return get_group();
                    inquirer.prompt([{
                        type: 'list',
                        name: "provider",
                        message: "Choose your source code management provider",
                        choices: choices
                    }]).then(answers => {
                        get_group(answers.provider);
                    });
                });
            }
        })
    });


}();