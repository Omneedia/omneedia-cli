module.exports = {
    config: function(cb) {
        var fs = require('fs');
        var path = require('path');
        var os = require('os');
        var sep = "/";
        var root = os.homedir() + sep + 'omneedia';
        if (!fs.existsSync(root)) fs.mkdirSync(root);

        fs.readFile(root + sep + '.config', function(e, r) {
            if (e) {
                var ocfg = {
                    current: {}
                };
                global.CFG = ocfg;
                if (!global.CFG.secret) global.CFG.secret = require('shortid').generate();
                fs.writeFile(root + sep + '.config', JSON.stringify(ocfg), function() {
                    fs.readFile(root + sep + '.login', function(e, r) {
                        if (r) {
                            global.CFG.PID = r.toString('utf-8');
                        };
                        cb();
                    });
                });
            } else {
                try {
                    global.CFG = JSON.parse(r.toString('utf-8'));
                    if (!global.CFG.secret) {
                        global.CFG.secret = require('shortid').generate();
                        fs.writeFile(root + sep + '.config', JSON.stringify(global.CFG), cb);
                        return;
                    };
                    fs.readFile(root + sep + '.login', function(e, r) {
                        if (r) {
                            global.CFG.PID = r.toString('utf-8');
                        }
                        cb();
                    });
                } catch (e) {
                    fs.unlink(root + sep + '.config', function() {
                        var ocfg = {
                            current: {}
                        };
                        global.CFG = ocfg;
                        if (!global.CFG.secret) global.CFG.secret = require('shortid').generate();
                        fs.writeFile(root + sep + '.config', JSON.stringify(ocfg), function() {
                            fs.readFile(root + sep + '.login', function(e, r) {
                                if (r) {
                                    global.CFG.PID = r.toString('utf-8');
                                };
                                cb();
                            });
                        });
                    });
                }
            }
        });
    },
    display: function(cb) {
        var figlet = require('figlet');
        var colors = require('colors');
        var util = require('./util');
        require('fs').readFile(__dirname + '/../package.json', function(e, b) {
            global.$_VERSION = JSON.parse(b.toString('utf-8')).version;
            figlet(' omneedia', {
                font: "Ogre"
            }, function(err, art) {
                if (err) util.error('GURU MEDITATION: ' + err);
                console.log('\n        Omneedia CLI v' + $_VERSION);
                console.log(art.cyan);
                if (process.args.welcome) return;
                if (process.argv.length <= 2) {
                    console.log('    Usage: oa command [options]'.yellow);
                    console.log('');
                    console.log('');
                    console.log('    Create: '.green);
                    console.log('    create <namespace> <TPL: webapp|desktop|mobile>\t\tCreate a project'.white);
                    console.log('');
                    console.log('    Config: '.green);
                    console.log('    config\t\t\t\t\tDisplay config'.white);
                    console.log('    config set <key> <value>\t\t\tSet setting=value'.white);
                    console.log('    config unset <key>\t\t\t\tUnset setting'.white);
                    console.log('    config load <name>\t\t\t\tLoad config [name]'.white);
                    console.log('    config save <name>\t\t\t\tSave current config to [name]'.white);
                    console.log('');
                    console.log('    Project: '.green);
                    console.log('    update\t\t\t\t\tUpdate project'.white);
                    console.log('    start\t\t\t\t\tStart drone app'.white);
                    console.log('');
                    console.log('    Samples: '.green);
                    console.log('    oa config set proxy http://my.proxy.com:8080/'.white);
                    console.log('');
                };
                cb();
            });
        });
    }
};