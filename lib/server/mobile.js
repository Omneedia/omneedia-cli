module.exports = function(app, express) {
    var path = require('path');
    var sep = "/";
    var fs = require('fs');
    app.use(function(req, res, next) {
        var walk = function(dir, done) {
            var results = [];
            fs.readdir(dir, function(err, list) {
                if (err) return done(err);
                var pending = list.length;
                if (!pending) return done(null, results);
                list.forEach(function(file) {
                    file = dir + '/' + file;
                    fs.stat(file, function(err, stat) {
                        if (stat && stat.isDirectory()) {
                            walk(file, function(err, res) {
                                results = results.concat(res);
                                if (!--pending) done(null, results);
                            });
                        } else {
                            results.push(file);
                            if (!--pending) done(null, results);
                        }
                    });
                });
            });
        };
        if ((req.originalUrl.indexOf('.html') > -1) || (req.originalUrl.indexOf('.scss') > -1)) {
            var filename = req.originalUrl.replace('/', sep);
            var dir = PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Application';
            walk(dir, function(e, r) {
                if (e) return res.status(404).send('Not found');
                for (var i = 0; i < r.length; i++) {
                    if (r[i].indexOf(filename) > -1) {
                        fs.readFile(r[i], function(e, r) {
                            if (e) return res.status(404).send('Not found');
                            res.set('Content-Type', 'text/html');
                            res.end(r.toString('utf-8'));
                            return;
                        });
                        return;
                    }
                };
                return res.status(404).send('Not found');
            });
            return;
        } else next();
    });

    // theme
    app.use('/ionic/', express.static(__dirname + sep + 'mobile' + sep + 'ionic'));

    // api mobile
    app.get('/api/(*)', function(req, res) {
        var PACK = false;
        var DEFS = [];
        var Args = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

        function loader(i, cb) {
            if (!PACK.class[i]) return cb();
            global.request(PACK.uri + '/' + PACK.class[i] + '?javascript', function(e, r, b) {
                DEFS.push(b.split('App.REMOTING_API=')[1].split(';')[0]);
                loader(i + 1, cb);
            });
        };
        res.set('Content-Type', 'application/javascript');
        var SCRIPT = [];
        var classname = req.url.split('/api/')[1];
        if (settings.api) {

            for (var i = 0; i < settings.api.length; i++) {
                if (settings.api[i].name == classname) PACK = settings.api[i];
            };

            if (PACK === false) return res.status(404).end('NOT_FOUND');

            loader(0, function() {

                for (var i = 0; i < PACK.class.length; i++) {
                    var def = JSON.parse(DEFS[i]);
                    var URI = def.url;
                    URI = URI.replace(/([^:]\/)\/+/g, URI);
                    var post = [{
                        "action": PACK.class[i],
                        "method": "-",
                        "data": [

                        ],
                        "type": "rpc",
                        "tid": 1
                    }];
                    SCRIPT.push('export class ' + PACK.class[i] + ' {');
                    SCRIPT.push('\tstatic ajax(o:any) {');
                    SCRIPT.push('\t\tvar xhr = new XMLHttpRequest();');
                    SCRIPT.push('\t\txhr.open(o.type, o.url);');
                    SCRIPT.push('\t\txhr.setRequestHeader(\'Content-Type\', o.contentType);');
                    SCRIPT.push('\t\txhr.onload = function() {');
                    SCRIPT.push('\t\t\tif (xhr.status === 200) o.success(xhr.responseText);');
                    SCRIPT.push('\t\t\telse {');
                    SCRIPT.push('\t\t\t\tif (o.error) o.error(xhr.status);');
                    SCRIPT.push('\t\t\t}');
                    SCRIPT.push('\t\t};');
                    SCRIPT.push('\t\tif( (typeof o.data === "object") && (o.data !== null) ) xhr.send(JSON.stringify(o.data)); else xhr.send(o.data);');
                    SCRIPT.push('\t};');
                    var statics = def.actions[PACK.class[i]];
                    for (var j = 0; j < statics.length; j++) {
                        var fn = 'static ' + statics[j].name;
                        var args = [];
                        var xargs = [];
                        for (var k = 0; k < statics[j].len; k++) {
                            args.push(Args[k] + ':any');
                            xargs.push(Args[k]);
                        };
                        args.push('callback:any');
                        SCRIPT.push('\t' + fn + '(' + args.join(',') + ') {');
                        SCRIPT.push('\t\tvar post=[');
                        SCRIPT.push('\t\t\t{');
                        SCRIPT.push('\t\t\t"action": "' + PACK.class[i] + '",');
                        SCRIPT.push('\t\t\t"method": "' + statics[j].name + '",');
                        SCRIPT.push('\t\t\t"data": [' + xargs.join(',') + '],');
                        SCRIPT.push('\t\t\t"type": "rpc",');
                        SCRIPT.push('\t\t\t"tid": 1');
                        SCRIPT.push('\t\t\t}');
                        SCRIPT.push('\t\t];');

                        SCRIPT.push('\t\tthis.ajax({');
                        SCRIPT.push('\t\t\ttype: \'post\',');
                        SCRIPT.push('\t\t\turl: "' + URI + '",');
                        SCRIPT.push('\t\t\tdata: JSON.stringify(post),');
                        SCRIPT.push('\t\t\tcontentType: "application/json; charset=utf-8",');
                        SCRIPT.push('\t\t\tsuccess: function (data) {');
                        SCRIPT.push('\t\t\t\tdata=JSON.parse(data);');
                        SCRIPT.push('\t\t\t\tcallback(data[0].result);');
                        SCRIPT.push('\t\t\t}');
                        SCRIPT.push('\t\t});');

                        SCRIPT.push('\t};');
                    };
                    SCRIPT.push('};');
                };
                res.end(SCRIPT.join('\n'));
            });

        } else res.status(404).end('NOT_FOUND');

    });

    app.get('/main.css', function(req, res) {
        var sass = require('npm-sass');
        var theme = PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Resources' + sep + 'theme' + sep;
        var _theme = __dirname + sep + "mobile" + sep + "ionic" + sep;

        var font = '$font-path: "/ionic/fonts' + '";';

        var list = [];
        list.push('@import "' + _theme + 'themes' + sep + 'ionic.globals";');
        list.push('@import "' + _theme + 'themes' + sep + 'ionic.theme.default";');
        list.push('@import "' + _theme + 'themes' + sep + 'ionic.ionicons";');
        list.push('@import "' + _theme + 'fonts' + sep + 'roboto";');
        list.push('@import "' + _theme + 'fonts' + sep + 'noto-sans";');
        list.push('@import "' + _theme + 'themes' + sep + 'ionic.components";');

        fs.mkdir(theme, function() {
            fs.writeFile(theme + 'fonts.scss', font, function(e) {
                fs.writeFile(theme + 'framework.scss', list.join('\n'), function(e) {
                    sass(PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Resources' + sep + 'theme.scss', function(err, result) {
                        if (err) {
                            res.end(JSON.stringify(err, null, 4));
                            return;
                        };
                        res.writeHead(200, {
                            'Content-Type': 'text/css'
                        });
                        res.end(result.css.toString('utf-8'));
                    });
                });
            });
        });

    });

    // mockup
    app.use('/mobile', express.static(__dirname + sep + 'mobile' + sep + 'www'));

    app.use('/assets/i18n', express.static(PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Culture'));

    app.get('/tsconfig.json', function(req, res) {
        var o = {
            "compilerOptions": {
                "target": "es5",
                "module": "system",
                "moduleResolution": "node",
                "sourceMap": true,
                "emitDecoratorMetadata": true,
                "experimentalDecorators": true,
                "removeComments": false,
                "noImplicitAny": true,
                "suppressImplicitAnyIndexErrors": true
            }
        };
        res.set('Content-Type', 'application/json');
        res.end(JSON.stringify(o));
    });
    app.get('/pages/(*)', function(req, res) {
        var _path = req.originalUrl.replace('/', sep);
        _path = PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Application' + _path;
        fs.readFile(_path, function(e, r) {
            if (e) {
                fs.readFile(_path + '.ts', function(e, r) {
                    if (e) return res.status(404).send('Not found');
                    res.set('Content-Type', 'text/javascript');
                    res.end(r.toString('utf-8'));
                });
            } else res.end(r.toString('utf-8'));
        });
    });

    app.get('/providers/(*)', function(req, res) {
        var path = require('path');
        var _path = req.originalUrl.replace('/', sep);
        _path = PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Application' + _path;
        fs.readFile(_path, function(e, r) {
            if (e) {
                fs.readFile(_path + '.ts', function(e, r) {
                    if (e) return res.status(404).send('Not found');
                    res.set('Content-Type', 'text/javascript');
                    res.end(r.toString('utf-8'));
                });
            } else res.end(r.toString('utf-8'));
        });
    });
    app.get('/mobile/icon.png', function(req, res) {
        fs.readFile(global.PROJECT_HOME + sep + manifest.icon.file, function(e, favicon) {
            if (e) return res.status(404).send('Not found');
            res.end(favicon);
        });
    });
    app.get('/mobile/qrcode', function(req, res) {
        function generateCode(data) {
            var QRCode = require('qrcode-npm');
            var qr = QRCode.qrcode(4, 'L');
            qr.addData(data);
            qr.make();
            var qrimgtag = qr.createImgTag(4);
            var idx = qrimgtag.indexOf("base64,") + 7;
            qrimgtag = qrimgtag.substring(idx);
            idx = qrimgtag.indexOf("\"");
            return new Buffer(qrimgtag.split('"')[0], 'base64');
        };
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(generateCode(req.protocol + '://' + getIPAddress() + ':' + manifest.server.port + '/default'));
    });
    app.get('/cordova.js', function(req, res) {
        // define os type
        var os_type = -1;
        res.set('Content-Type', 'text/javascript');
        var ua = req.headers['user-agent'];
        if (/Windows NT/.test(ua)) os_type = "browser";
        if (/(Intel|PPC) Mac OS X/.test(ua)) os_type = "browser";
        else if (/like Mac OS X/.test(ua)) os_type = "ios";
        if (/Android/.test(ua)) os_type = "android";
        var cordova = __dirname + sep + 'mobile' + sep + 'cordova' + sep + 'cordova.' + os_type + '.js';
        fs.readFile(cordova, function(e, r) {
            if (e) res.status('404').send('Not found');
            res.end(r.toString('utf-8'));
        });
    });

    app.get('/mobile/plugins/(*)', function(req, res) {
        var parser = require('xml2js');
        var os_type = -1;
        var ua = req.headers['user-agent'];
        if (/Windows NT/.test(ua)) os_type = "browser";
        if (/(Intel|PPC) Mac OS X/.test(ua)) os_type = "browser";
        else if (/like Mac OS X/.test(ua)) os_type = "ios";
        if (/Android/.test(ua)) os_type = "android";
        var root = PROJECT_BIN + sep + 'node_modules' + sep;
        var dir = root + req.originalUrl.split('/mobile/plugins/')[1].split(':')[0];
        var id = req.originalUrl.split('/mobile/plugins/')[1].split(':')[1];
        fs.readFile(dir, function(e, r) {
            if (e) return res.status('404').send('Not found');
            res.set('Content-Type', 'text/javascript');
            res.end('cordova.define("' + id + '", function(require, exports, module) {\n' + r.toString('utf-8') + '\n})');
        });
    });
    app.get('/cordova_plugins.js', function(req, res) {
        var parser = require('xml2js');
        // define os type
        var os_type = -1;
        res.set('Content-Type', 'text/javascript');
        var ua = req.headers['user-agent'];
        if (/Windows NT/.test(ua)) os_type = "browser";
        if (/(Intel|PPC) Mac OS X/.test(ua)) os_type = "browser";
        else if (/like Mac OS X/.test(ua)) os_type = "ios";
        if (/Android/.test(ua)) os_type = "android";

        var html = ["cordova.define('cordova/plugin_list', function(require, exports, module) {"];

        var data = [];
        var dirs = [];
        var metadata = {};
        var plugins_dir = PROJECT_BIN + sep + 'node_modules' + sep;

        function add_plugin(d, i, cb) {
            if (!d[i]) return cb();
            var filename = plugins_dir + sep + d[i] + sep + 'plugin.xml';
            fs.readFile(filename, function(err, dta) {
                if (err) {
                    add_plugin(d, i + 1, cb);
                    return;
                };
                parser.parseString(dta, function(err, result) {
                    var id = -1;
                    var platform = [];
                    var jsmodule = [];
                    for (var el in result.plugin) {
                        if (el == "platform") {
                            for (var p = 0; p < result.plugin[el].length; p++) {
                                var item = result.plugin[el][p];
                                if (item.$.name == os_type) {
                                    var module = item['js-module'];
                                    if (item['js-module']) {
                                        for (var x = 0; x < module.length; x++) {
                                            var isRun = false;
                                            if (module[x].runs) isRun = true;
                                            platform.push({
                                                file: 'mobile/plugins/' + id + '/' + module[x]['$'].src + ':' + id + '.' + module[x]['$'].name,
                                                id: id + '.' + module[x]['$'].name,
                                                pluginId: id,
                                                runs: isRun
                                            });
                                        }
                                    }
                                }
                            }
                        };
                        if (el == "$") {
                            id = result.plugin['$'].id;
                            metadata[id] = result.plugin['$'].version;
                        };
                        if (el == "js-module") {
                            for (var j = 0; j < result.plugin['js-module'].length; j++) {
                                var clobbers = [];
                                if (result.plugin['js-module'][j].clobbers) {
                                    for (var k = 0; k < result.plugin['js-module'][j].clobbers.length; k++) {
                                        clobbers.push(result.plugin['js-module'][j].clobbers[k].$.target);
                                    };
                                };
                                jsmodule.push({
                                    file: 'mobile/plugins/' + id + '/' + result.plugin['js-module'][j]['$'].src + ':' + id + '.' + result.plugin['js-module'][j]['$'].name,
                                    id: id + '.' + result.plugin['js-module'][j]['$'].name,
                                    pluginId: id,
                                    clobbers: clobbers
                                });
                            };
                        };
                    };
                    for (var u = 0; u < platform.length; u++) {
                        data.push(platform[u]);
                    };
                    for (var u = 0; u < jsmodule.length; u++) {
                        data.push(jsmodule[u]);
                    };
                    add_plugin(d, i + 1, cb);
                });
            });
        };
        var d = [];
        for (var i = 0; i < manifest.plugins.length; i++) d.push(manifest.plugins[i]);
        add_plugin(d, 0, function() {
            res.set('Content-Type', 'text/javascript');
            html.push("\tmodule.exports = " + JSON.stringify(data, null, 4) + ';');
            html.push("\tmodule.exports.metadata = " + JSON.stringify(metadata, null, 14) + ";");
            html.push("});");
            res.end(html.join(''));
        });
    });
};