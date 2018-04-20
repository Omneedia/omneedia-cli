module.exports = function (app) {
    var fs = require('fs');
    var path = require('path');
    var sep = "/";

    var util = require('./util');
    var SCRIPT = [];

    app.get('/Contents/Settings.js', function (req, res) {
        // making settings
        var Settings = {};
        Settings.DEBUG = true;
        Settings.NAMESPACE = manifest.namespace;
        Settings.TITLE = manifest.title;
        Settings.DESCRIPTION = manifest.description
        Settings.COPYRIGHT = manifest.copyright;
        Settings.TYPE = manifest.type;
        Settings.PLATFORM = manifest.platform;
        Settings.TYPE = manifest.platform;
        Settings.LANGS = manifest.langs;
        Settings.PATHS = manifest.paths;
        Settings.AUTH = {
            passports: [],
            passport: {}
        };
        var frameworks = [];
        var resources = [];
        var langs = [];
        var paths = {};
        for (var el in manifest.paths) {
            if (el.indexOf('@') == 0) paths[el] = manifest.paths[el];
        };
        for (var i = 0; i < manifest.frameworks.length; i++) {
            var m = manifest.frameworks[i];
            if (m.src) {
                if (m.src.constructor === Array) {
                    for (var zz = 0; zz < m.src.length; zz++) {
                        var src = m.src[zz].replace(/{version}/g, m.version);
                        src = src.replace(/{theme}/g, m.theme);
                        src = src.replace(/{style}/g, m.style);
                        for (var el in paths) {
                            if (src.indexOf(el) > -1) src = src.replace(el, paths[el]);
                        };
                        frameworks.push(src);
                    }
                } else {
                    var src = m.src.replace(/{version}/g, m.version);
                    src = src.replace(/{theme}/g, m.theme);
                    src = src.replace(/{style}/g, m.style);
                    for (var el in paths) {
                        if (src.indexOf(el) > -1) src = src.replace(el, paths[el]);
                    };
                    frameworks.push(src);
                }
            };
            if (m.res) {
                if (m.res.constructor === Array) {
                    for (var zz = 0; zz < m.res.length; zz++) {
                        var _res = m.res[zz].replace(/{version}/g, m.version);
                        _res = _res.replace(/{theme}/g, m.theme);
                        _res = _res.replace(/{style}/g, m.style);
                        for (var el in paths) {
                            if (_res.indexOf(el) > -1) _res = _res.replace(el, paths[el]);
                        };
                        resources.push(_res);
                    }
                } else {
                    var _res = m.res.replace(/{version}/g, m.version);
                    _res = _res.replace(/{theme}/g, m.theme);
                    _res = _res.replace(/{style}/g, m.style);
                    for (var el in paths) {
                        if (_res.indexOf(el) > -1) _res = _res.replace(el, paths[el]);
                    };
                    resources.push(_res);
                }
            };
            if (m['i18n']) {
                if (m['i18n'].constructor === Array) {
                    for (var zz = 0; zz < m['i18n'].length; zz++) {
                        var _lng = m['i18n'][zz].replace(/{version}/g, m.version);
                        _lng = _lng.replace(/{theme}/g, m.theme);
                        _lng = _lng.replace(/{style}/g, m.style);
                        for (var el in paths) {
                            if (_lng.indexOf(el) > -1) _lng = _lng.replace(el, paths[el]);
                        };
                        if (langs.indexOf(_lng) == -1) langs.push(_lng);
                    }
                } else {
                    var _lng = m['i18n'].replace(/{version}/g, m.version);
                    _lng = _lng.replace(/{theme}/g, m.theme);
                    _lng = _lng.replace(/{style}/g, m.style);
                    for (var el in paths) {
                        if (_lng.indexOf(el) > -1) _lng = _lng.replace(el, paths[el]);
                    };
                    if (langs.indexOf(_lng) == -1) langs.push(_lng);
                }
            }
        };
        Settings.FRAMEWORKS = frameworks;
        Settings.RESOURCES = resources;
        Settings['i18n'] = langs;

        if (manifest.libraries) Settings.LIBRARIES = manifest.libraries;
        else Settings.LIBRARIES = [];
        var IS_EXT = -1;
        for (var i = 0; i < manifest.frameworks.length; i++) {
            if (manifest.frameworks[i].name == "EXTJS") {
                var _framework_version = manifest.frameworks[i].version.split('.')[0] + '.x';
                var _framework_theme = manifest.frameworks[i].theme;
                IS_EXT = 1;

            }
        };
        if (IS_EXT == 1) {
            global.$_CDN = "/cdn";
            Settings.PATHS = {

            };
            var ppath = [];
            for (var el in manifest.paths) {
                if (el.indexOf('@') > -1) ppath.push(el);
            };
            for (var el in manifest.paths) {
                Settings.PATHS[el] = manifest.paths[el];
                for (var i = 0; i < ppath.length; i++) {
                    if (manifest.paths[el].indexOf(ppath[i]) > -1) Settings.PATHS[el] = manifest.paths[ppath[i]] + Settings.PATHS[el].split(ppath[i])[1];
                };
            };

        };
        Settings.CONTROLLERS = [];
        if (manifest.controllers)
            for (var i = 0; i < manifest.controllers.length; i++) Settings.CONTROLLERS.push(manifest.controllers[i]);
        Settings.LIBRARIES = [];
        if (manifest.libraries)
            for (var i = 0; i < manifest.libraries.length; i++) Settings.LIBRARIES.push(manifest.libraries[i]);
        Settings.AUTHORS = [];
        Settings.API = [];
        Settings.API.push('__QUERY__');
        for (var i = 0; i < manifest.api.length; i++) {
            if (manifest.api[i].indexOf('@') == -1) Settings.API.push(manifest.api[i]);
            else {
                if (!Settings.API_REMOTE) Settings.API_REMOTE = {};
                var server = manifest.api[i].split('@')[1];
                var url = Settings.PATHS[server];
                Settings.API_REMOTE[server] = "/api/" + server + ".js";
            }
        };
        Settings.AUTHORS.push({
            role: "creator",
            name: manifest.author.name,
            mail: manifest.author.mail,
            twitter: manifest.author.twitter,
            web: manifest.author.web,
            github: manifest.author.github
        });
        Settings.DB = {};
        for (var i = 0; i < global.settings.db.length; i++) {
            if (global.settings.db[i].uri.indexOf('http') > -1) Settings.DB[global.settings.db[i].name] = global.settings.db[i].uri;
        };
        for (var el in manifest.team) {
            var tabx = manifest.team[el];
            var role = el;
            for (var i = 0; i < tabx.length; i++) {
                Settings.AUTHORS.push({
                    role: role,
                    name: tabx[i].name,
                    mail: tabx[i].mail,
                    twitter: tabx[i].twitter,
                    web: tabx[i].web,
                    github: tabx[i].github
                });
            };
        };
        Settings.VERSION = manifest.version;
        Settings.BUILD = manifest.build;
        Settings.MODULES = [];
        if (manifest.blur) Settings.blur = manifest.blur;
        else Settings.blur = 1;
        // Modules
        function do_modules(cb) {
            for (var i = 0; i < manifest.modules.length; i++) Settings.MODULES.push(manifest.modules[i]);
            cb();
        };
        // Auth
        function do_auth(cb) {
            function me_auth(auth, i, cb) {
                if (!auth[i]) return cb();
                var t0 = __dirname + sep + '..' + sep + "auth.template" + sep + auth[i] + ".config";
                fs.readFile(t0, function (e, r) {
                    if (e) util.error('Auth template not found');
                    try {
                        var t0 = JSON.parse(r.toString('utf-8'));
                    } catch (e) {
                        util.error('Auth template not readable');
                    }
                    Settings.AUTH.passports.push(t0.type);
                    Settings.AUTH.passport[t0.type] = {
                        caption: "PASSPORT_" + manifest.auth[i].toUpperCase()
                    };
                    me_auth(auth, i + 1, cb);
                });
            };
            me_auth(manifest.auth, 0, cb);
        };

        function do_api(cb) {
            var providers = [];
            var pp = [];
            var catalog = {};

            function get_providers_catalog(providers, ndx, cbx) {
                if (!providers[ndx]) return cbx();
                global.request({
                        url: providers[ndx].uri,
                        method: "POST",
                        form: {
                            catalog: "*"
                        }
                    },
                    function (e, r, body) {
                        if (e) return get_providers_catalog(providers, ndx + 1, cbx);
                        catalog[providers[ndx].name] = JSON.parse(body.toString('utf-8'));
                        get_providers_catalog(providers, ndx + 1, cbx);
                    });
            };
            if (global.settings.api) {
                for (var i = 0; i < global.settings.api.length; i++) {
                    if (providers.indexOf(global.settings.api[i].name) == -1) {
                        providers.push(global.settings.api[i].name);
                        pp.push({
                            name: global.settings.api[i].name,
                            uri: global.settings.api[i].uri
                        });
                    }
                };
                get_providers_catalog(pp, 0, function () {
                    for (var el in catalog) {
                        SCRIPT.push('App.' + el + '={};');
                        for (var i = 0; i < global.settings.api.length; i++) {
                            if (global.settings.api[i].name == el) {
                                var url = global.settings.api[i].uri;
                            };
                        };
                        for (var i = 0; i < catalog[el].interface.length; i++) {
                            var classname = catalog[el].interface[i];
                            SCRIPT.push('App.' + el + '.' + classname + '={};')
                            for (var j = 0; j < catalog[el].class[classname].methods.length; j++) {
                                var method = catalog[el].class[classname].methods[j];
                                var args = catalog[el].class[classname].method[method];
                                var post = "[{'action':'" + classname + "','method':'" + method + "','data':[" + args.join(',') + "],'type':'rpc','tid':1}]";
                                SCRIPT.push('App.' + el + '.' + classname + '.' + method + ' = function(' + args.join(',') + ') {');
                                args.pop();
                                var post = "var post=[{action:'" + classname + "',method:'" + method + "',data:[" + args.join(',') + "],type:'rpc',tid:1}];";
                                var ajax = "$.ajax({type:'post',url:'" + url + "',data:JSON.stringify(post),contentType:'application/json;charset=utf-8',traditional:true,success:function(data){data=JSON.parse(data);cb(data[0].result)}})";
                                SCRIPT.push(post + ajax + '};')
                            };
                        }
                    };
                    cb();
                });
            } else cb();
        };
        do_auth(function () {
            do_modules(function () {
                res.set('Content-Type', 'text/javascript');
                res.end('Settings=' + JSON.stringify(Settings, null, 4));
            });
        })
    });
};