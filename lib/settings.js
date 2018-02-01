module.exports = {
    update: function(manifest, cb) {

        var fs = require('fs');
        var path = require('path');
        var sep = "/";
        var util = require('./util');
        var emojic = require('emojic');
        var chalk = require('chalk');

        if (process.args.settings) {
            var def = process.args.settings;
            if (def != true) {
                console.log('\t' + emojic.whiteCheckMark + '  Switching to ' + chalk.bgGreen(' ' + def + ' '));
                console.log(' ');
            } else delete(def);
        };

        var set = global.PROJECT_ETC + sep + 'settings';
        if (def) set += "-" + def;
        set += ".json";

        var settings = {
            auth: {},
            db: []
        };

        function update_auth(auth, i, cb) {
            if (!auth[i]) return cb();
            fs.readFile(__dirname + sep + '..' + sep + "auth.template" + sep + auth[i] + ".config", function(e, r) {
                if (e) util.error("Can't find [" + auth[i] + "] AUTH settings");
                try {
                    var yauth = JSON.parse(r.toString('utf-8'));
                } catch (e) {
                    util.error("Error found in [" + auth[i] + "]");
                };
                if (!settings.auth[yauth.type]) settings.auth[yauth.type] = yauth.config;
                update_auth(auth, i + 1, cb);
            })
        };
        fs.readFile(set, function(e, r) {
            if (e) settings = {
                auth: {},
                db: []
            };
            else {
                try {
                    settings = JSON.parse(r.toString('utf-8'));
                } catch (e) {
                    settings = { auth: {}, db: [] };
                }
            };
            // db
            var dbs = [];
            for (var j = 0; j < settings.db.length; j++) dbs.push(settings.db[j].name);
            var dbtpl = "mysql://root@127.0.0.1/";
            if (manifest.db) {
                for (var i = 0; i < manifest.db.length; i++) {
                    if (dbs.indexOf(manifest.db[i]) == -1) settings.db.push({
                        name: manifest.db[i],
                        uri: dbtpl + manifest.db[i]
                    });
                }
            };
            // api
            if (manifest.api) {
                for (var i = 0; i < manifest.api.length; i++) {
                    if (manifest.api[i].indexOf('@') > -1) {
                        if (!settings.api) settings.api = [];
                        var api_to_create = -1;
                        for (var z = 0; z < settings.api.length; z++) {
                            if (settings.api[z].name == manifest.api[i].split('@')[1]) api_to_create = 1;
                        };
                        if (api_to_create == -1) {
                            settings.api.push({
                                name: manifest.api[i].split('@')[1],
                                uri: "http(s)://my_api_server.com/api",
                                class: []
                            });
                        };
                        for (var z = 0; z < settings.api.length; z++) {
                            if (settings.api[z].name == manifest.api[i].split('@')[1]) {
                                if (settings.api[z].class.indexOf(manifest.api[i].split('@')[0]) == -1) settings.api[z].class.push(manifest.api[i].split('@')[0]);
                            }
                        }
                    };
                };
            };
            // auth
            for (el in settings.auth) {
                if (manifest.auth.indexOf(el) == -1) delete settings.auth[el];
            };
            update_auth(manifest.auth, 0, function() {
                fs.writeFile(set, JSON.stringify(settings, null, 4), function() {
                    global.settings = settings;
                    cb(settings);
                });
            });
        });
    }
}