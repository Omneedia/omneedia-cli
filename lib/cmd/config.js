module.exports = function() {
    var path = require('path');
    var sep = "/";
    var fs = require('fs');
    var prettyjson = require('prettyjson');
    var shelljs = require('shelljs');
    const os = require('os');

    var root = os.homedir() + sep + 'omneedia';
    if (!fs.existsSync(root)) fs.mkdirSync(root);

    var help = require('../help');
    var p = process.argv.indexOf('config');
    var CMD = process.argv[p + 1];

    var cfg = {
        display: function() {
            console.log('');
            var name = global.CFG.name;
            if (!name) name = "";
            console.log('-------');
            console.log('Config: ' + name.cyan);
            console.log('-------');
            console.log(prettyjson.render(global.CFG['current']));
            console.log('');
        },
        set: function(ndx, value) {
            global.CFG.current[ndx] = value;
            fs.writeFile(root + sep + ".config", JSON.stringify(global.CFG, null, 4), function(e) {
                cfg.display();
            });
        },
        save: function(ns) {
            var config = global.CFG;
            config[ns] = config.current;
            config.name = ns;
            fs.writeFile(root + sep + ".config", JSON.stringify(config, null, 4), function(e) {
                console.log('- config saved.'.green);
                console.log('');
            });
        },
        unset: function(ndx) {
            var config = global.CFG;
            if (!config.current) config.current = {};
            delete config.current[ndx];
            fs.writeFile(root + sep + ".config", JSON.stringify(config, null, 4), function(e) {
                cfg.display();
            });
        },
        load: function(ndx) {
            // unset proxy for omneedia
            var PROXY = "";
            var config = global.CFG;
            console.log('- Loading config ' + ndx.white);
            // unset proxy for npm
            shelljs.exec('npm config delete proxy', {
                silent: true
            });
            shelljs.exec('npm config delete https-proxy', {
                silent: true
            });
            // unset proxy for git
            shelljs.exec('git config --global core.pager cat', {
                silent: true
            });
            shelljs.exec('git config --global --unset http.proxy', {
                silent: true
            });
            shelljs.exec('git config --global --unset https.proxy', {
                silent: true
            });
            config.name = ndx;
            if (!config.current) config.current = {};
            if (config[ndx]) config.current = config[ndx];

            // set proxy for omneedia
            if (config.current['proxy']) {
                PROXY = config.current['proxy'];
                // set proxy for npm
                shelljs.exec('npm config set proxy ' + PROXY, {
                    silent: true
                });
                shelljs.exec('npm config set https-proxy ' + PROXY, {
                    silent: true
                });
                // set proxy for git
                shelljs.exec('git config --global http.proxy ' + PROXY);
                shelljs.exec('git config --global https.proxy ' + PROXY);
            }
            fs.writeFile(root + sep + ".config", JSON.stringify(config, null, 4), function(e) {
                cfg.display();
            });

        }
    };

    var CMDS = ["set", "unset", "save", "load"];

    if (CMD == "set") {
        var ndx = process.argv[p + 2];
        var value = process.argv[p + 3];
        if ((!ndx) && (!value)) help.display('config');
        return cfg.set(ndx, value);
    };
    if (CMD == "unset") {
        var ndx = process.argv[p + 2];
        if (!ndx) help.display('config');
        return cfg.unset(ndx);
    };
    if (CMD == "save") {
        var name = process.argv[p + 2];
        if (!name) help.display('config');
        return cfg.save(name);
    };
    if (CMD == "load") {
        var name = process.argv[p + 2];
        if (!name) help.display('config');
        return cfg.load(name);
    };

    if (CMD) {
        if (CMDS.indexOf(CMD) == -1) help.display('config');
    };

    cfg.display();

}();