module.exports = function () {

    var util = require('../util');
    var help = require('../help');
    var path = require('path');
    var sep = "/";
    var fs = require('fs-extra');
    var emojic = require('emojic');
    var ascii = /^[ -~\t\n\r]+$/;
    var chalk = require('chalk');
    var inquirer = require('inquirer');

    require('../globals');

    var root = __dirname + sep + '..' + sep + '..';

    var p = -1;
    for (var i = 1; i < process.argv.length; i++) {
        if (process.argv[i].indexOf('generate') > -1) p = i + 1;
        if (process.argv[i].indexOf('g') > -1) p = i + 1;
    };

    function space(ln) {
        var p = "";
        for (var i = 0; i < ln; i++) p += ".";
        return chalk.white(p);
    };

    if (process.argv.length < 5) {
        console.log(chalk.bold('Usage:\n'));
        console.log(chalk.white('\t$') + ' ' + chalk.green.bold('oa g ') + chalk.green('[controller|view|model] ' + '<name>'));
        console.log('');
        console.log(chalk.bold('Generate:'));
        console.log((chalk.green('\t oa g controller my_new_controller ') + space(10) + ' Generate a new controller named my_new_controller'));
        console.log((chalk.green('\t oa g view my_new_view ') + space(22) + ' Generate a new view named my_new_view'));
        console.log((chalk.green('\t oa g model my_new_model ') + space(20) + ' Generate a new model named my_new_model'));
        console.log('');
        return;
    };

    var cmd = process.argv[p];
    var nam = process.argv[p + 1];

    fs.readFile(__dirname + '/../../tpl/omneedia/' + cmd + '.tpl', function (e, b) {
        if (e) util.error(cmd + ' command not found.');
        b = b.toString('utf-8');
        b = b.replace('{{name}}', nam);
        fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {
            if (e) util.error("Can't find app.manifest ... Must be run inside your project root.");
            var manifest = JSON.parse(r.toString('utf-8'));
            if (cmd == "controller") {
                if (manifest.controllers.indexOf(nam) > -1) util.error(nam + ' already exists in controllers.');
                manifest.controllers.push(nam);
                fs.writeFile(global.PROJECT_HOME + sep + 'app.manifest', JSON.stringify(manifest, null, 4), function (e) {
                    fs.writeFile(global.PROJECT_APP + '/app/controller/' + nam + '.js', b,
                        function (e) {
                            console.log('\n[ OK ]'.green + '\tcontroller ' + chalk.bold(nam) + ' created.\n');
                        }
                    );
                });
            }
            if (cmd == "window") {
                var tpls = b.split('{{');
                var items = [];

                function callb(resp) {
                    for (var el in resp) {
                        var replace = "regex";
                        var re = new RegExp('{{' + el + '}}', "g");
                        b = b.replace(re, resp[el]);
                    }
                    if (nam.indexOf('.') > -1) {
                        var dir = nam.replace(/\./g, '/');
                        var D = dir.substr(0, dir.lastIndexOf('/'));
                        var E = dir.substr(dir.lastIndexOf('/') + 1, dir.length) + '.js';
                        util.makedirs([global.PROJECT_APP + '/app/view/' + D], function () {
                            fs.writeFile(global.PROJECT_APP + '/app/view/' + D + '/' + E, b,
                                function (e) {
                                    console.log('\n[ OK ]'.green + '\t view ' + chalk.bold(nam) + ' created.\n');
                                }
                            );
                        });
                    } else {
                        fs.writeFile(global.PROJECT_APP + '/app/view/' + nam + '.js', b,
                            function (e) {
                                console.log('\n[ OK ]'.green + '\t view ' + chalk.bold(nam) + ' created.\n');
                            }
                        );
                    };
                };

                for (var j = 1; j < tpls.length; j++) {
                    var item = tpls[j].split('}}')[0];
                    items.push({
                        type: 'input',
                        name: item,
                        message: item.split('@')[1],
                        default: nam,
                        validate: function (i) {
                            if (i) return true;
                            else return false;
                        }
                    });
                };
                if (items.length > 1) {
                    inquirer.prompt(items).then(callb);
                };
            }
        });
    });

}();