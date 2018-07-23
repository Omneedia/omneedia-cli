module.exports = function () {

    var fs = require('fs');
    var path = require('path');
    var sep = "/";
    var emojic = require("emojic");
    var shelljs = require('shelljs');
    var util = require('../util');
    var server = require('../server/start');
    var setmeup = require('../settings');
    var chalk = require('chalk');

    global.Clients = {
        uid: {},
        mail: {}
    };

    require('../globals');

    function update_npm(pkg, ndx, cb) {
        TO_INSTALL = false;
        if (!pkg[ndx]) {
            process.chdir(global.PROJECT_HOME);
            return cb();
        };
        if (ndx == 0) console.log('\t ');
        process.chdir(global.PROJECT_BIN);
        fs.mkdir(global.PROJECT_BIN + '/node_modules', function (e) {
            fs.readFile(global.PROJECT_BIN + '/node_modules/' + pkg[ndx].split('@')[0] + '/package.json', function (e, r) {
                if (e) TO_INSTALL = true;
                if (r) {
                    var json = JSON.parse(r.toString('utf-8'));
                    if (pkg[ndx].indexOf('@') == -1) TO_INSTALL = false;
                    else {
                        if (json.version == pkg[ndx].split('@')[1]) TO_INSTALL = false;
                        else TO_INSTALL = true;
                    }
                };
                if (TO_INSTALL) {
                    console.log(chalk.cyan('\t\t[ Installing ]\t') + chalk.yellow(pkg[ndx].split('@')[0]));
                    var exec = require('child_process').exec,
                        child;
                    child = exec('npm install ' + pkg[ndx],
                        function (error, stdout, stderr) {
                            update_npm(pkg, ndx + 1, cb);
                            if (error !== null) {
                                util.error('Can\'t install ' + pkg[ndx].split('@')[0]);
                            }
                        });
                } else {
                    console.log(chalk.green('\t\t[     OK     ]\t') + chalk.yellow(pkg[ndx].split('@')[0]) + ' version ' + json.version);
                    update_npm(pkg, ndx + 1, cb);
                }
            });



        });
    };

    function update_modules(manifest, cb) {
        // generate package.json
        var pkg = {
            name: manifest.namespace,
            description: manifest.description,
            dependencies: {},
            license: manifest.license
        };
        for (var j = 0; j < manifest.packages.length; j++) {
            if (manifest.packages[j].indexOf(':') > -1) {
                var name = manifest.packages[j].split(':')[0];
                var version = manifest.packages[j].split(':')[1];
            } else {
                var version = '';
                var name = manifest.packages[j];
            }
            pkg.dependencies[name] = version;
        };
        for (var j = 0; j < manifest.plugins.length; j++) {
            if (manifest.plugins[j].indexOf(':') > -1) {
                var name = manifest.plugins[j].split(':')[0];
                var version = manifest.plugins[j].split(':')[1];
            } else {
                var version = '';
                var name = manifest.plugins[j];
            }
            pkg.dependencies[name] = version;
        };
        fs.writeFile(global.PROJECT_BIN + sep + 'package.json', JSON.stringify(pkg, null, 4), function () {
            fs.readFile(global.PROJECT_BIN + sep + 'package.cache', function (e, r) {
                if (e) update_npm(manifest.packages, 0, cb);
                else {
                    // compare new package.json to package.cache
                    var cache = JSON.parse(r.toString('utf-8'));
                    if (JSON.stringify(pkg.dependencies) == JSON.stringify(cache.dependencies)) cb();
                    else update_npm(manifest.packages, 0, cb);
                }
            });

        });
    };

    console.log('');
    fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {
        if (e) util.error("Can't find app.manifest ... Must be run inside your project root.");
        try {
            var manifest = JSON.parse(r.toString('utf-8'));
        } catch (e) {
            util.error('Manifest not readable');
        };
        console.log('- Starting ' + manifest.namespace);
        console.log('  ' + manifest.title.cyan);
        console.log('  ' + manifest.description.cyan);
        console.log('  ' + manifest.copyright.cyan);
        console.log('  version ' + manifest.version.white);
        console.log('');
        console.log('\t' + emojic.whiteCheckMark + '  Updating modules');
        var dirs = [
            global.PROJECT_BIN,
            global.PROJECT_DEV,
            global.PROJECT_WEB,
            global.PROJECT_API,
            global.PROJECT_DEV,
            global.PROJECT_SYSTEM,
            global.PROJECT_ETC,
            global.PROJECT_TMP
        ];
        util.makedirs(dirs, function () {
            update_modules(manifest, function () {
                global.manifest = manifest;
                if (process.argv.indexOf('auto#0') > -1) global._FIRST_TIME = 1;
                else global._FIRST_TIME = 0;
                setmeup.update(manifest, function () {
                    server.start(manifest);
                })
            });
        });
    });
}();