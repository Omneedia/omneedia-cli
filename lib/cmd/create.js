module.exports = function() {
    var util = require('../util');
    var help = require('../help');
    var path = require('path');
    var sep = "/";
    var fs = require('fs-extra');
    var emojic = require('emojic');
    var ascii = /^[ -~\t\n\r]+$/;

    var root = __dirname + sep + '..' + sep + '..';

    var p = process.argv.indexOf('create');
    var PROJECT_NAME = process.argv[p + 1];
    var PROJECT_ROOT = "";
    if (!PROJECT_NAME) util.error('Project namespace must be like com.example.demo');
    if (PROJECT_NAME.split('.').length < 3) util.error('Project namespace must be like com.example.demo');
    if (!ascii.test(PROJECT_NAME)) {
        if (PROJECT_NAME.split('/').length > 2) util.error("You may provide only one workspace for your project namespace (ex: global/com.demo.test)");
        PROJECT_ROOT += PROJECT_NAME.split('/')[0];
        PROJECT_NAME = PROJECT_NAME.split('/')[1];
        if (!ascii.test(PROJECT_NAME)) util.error('Project namespace must contain only ascii characters.');
    };
    var PROJECT_HOME = process.cwd();
    fs.stat(PROJECT_HOME + PROJECT_ROOT + sep + PROJECT_NAME + sep + 'app.manifest', function(e, r) {
        if (r) util.error('Package namespace already exists.');
        console.log('- Create package ' + PROJECT_NAME);
        var CMD2 = process.argv[p + 2];
        if (CMD2) {
            if (process.args.tpl) {
                var template = global.CFG['current']['tpl.' + process.args.tpl];
                if (!template) util.error('template not found');
                var github = template + 'tpl.omneedia.*';
            } else {
                var template = "omneedia/tpl.omneedia.*";
                var github = "https://github.com/" + template;
            };
            github = github.replace('*', CMD2);
            var request = require('request');
            var Request = {};
            if (global.CFG.current.proxy) var Request = request.defaults({
                'proxy': global.CFG.current.proxy
            });
            else Request = request;
            console.log('	' + emojic.whiteCheckMark + '   Downloading project template');

            Request(github + '/archive/master.zip').on('response', function(response) {
                    if (response.rawHeaders.indexOf('404 Not Found') != -1) util.error('Template not found.');
                })
                .on('end', function() {
                    console.log('	' + emojic.whiteCheckMark + '   Unpacking project');
                    util.mkdir(PROJECT_HOME + PROJECT_ROOT + sep + PROJECT_NAME, function() {
                        var unzip = require('@omneedia/unzip');
                        var sid = require('shortid').generate();
                        var readStream = fs.createReadStream(require('os').tmpdir + sep + 'master.zip');
                        fs.mkdir(require('os').tmpdir + sep + sid, function() {
                            var writeStream = require('fstream').Writer(require('os').tmpdir + sep + sid);
                            readStream.pipe(unzip.Parse()).pipe(writeStream.on('close', function() {
                                fs.readdir(require('os').tmpdir + sep + sid, function(e, list) {
                                    if (e) util.error('Failed!');
                                    if (list.length == 0) util.error('Failed!');
                                    console.log('	' + emojic.whiteCheckMark + '   Configuring ' + PROJECT_NAME);
                                    var dir = PROJECT_HOME + PROJECT_ROOT + sep + PROJECT_NAME;
                                    fs.move(require('os').tmpdir + sep + sid + sep + list[0], dir + sep, { overwrite: true }, function(e) {
                                        if (e) util.error('Failed!');
                                        console.log('	' + emojic.whiteCheckMark + '   Project ' + PROJECT_NAME + ' created');
                                        global.PROJECT_NAME = PROJECT_NAME;
                                        global.PROJECT_HOME = dir;
                                        global.PROJECT_BIN = global.PROJECT_HOME + sep + "bin";
                                        global.PROJECT_DEV = global.PROJECT_HOME + sep + "dev";
                                        global.PROJECT_WEB = global.PROJECT_HOME + sep + "src";
                                        global.PROJECT_ETC = global.PROJECT_HOME + sep + "etc";
                                        global.PROJECT_TMP = global.PROJECT_HOME + sep + "tmp";
                                        global.PROJECT_APP = global.PROJECT_WEB + sep + 'Contents' + sep + 'Application'
                                        global.PROJECT_API = global.PROJECT_WEB + sep + "Contents" + sep + "Services";
                                        global.PROJECT_RES = global.PROJECT_WEB + sep + 'Contents' + sep + 'Resources';
                                        global.PROJECT_DEV = global.PROJECT_HOME + sep + "dev";
                                        global.PROJECT_SYSTEM = global.PROJECT_WEB + sep + "System";
                                        require('../update');
                                    });
                                });

                            }))
                        });
                    });
                })
                .pipe(fs.createWriteStream(require('os').tmpdir + sep + 'master.zip'));
        } else help.display('create');
    });
}();