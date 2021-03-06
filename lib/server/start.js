module.exports = {
    app: {},
    display_index: function (req, res) {
        var fs = require('fs');
        var path = require('path');
        var sep = "/";
        var manifest = global.manifest;
        var appID = require('shortid').generate() + require('shortid').generate();

        if (manifest.platform == "mobile") {
            if (req.originalUrl.indexOf("default") == -1) {
                var tpl = __dirname + sep + 'mobile' + sep + 'www' + sep + 'index.tpl';
                fs.readFile(tpl, function (e, r) {
                    if (e) res.status(404).send('Not found.');
                    var html = r.toString('utf-8');
                    html = html.replace(/{URL}/g, req.protocol + '://' + req.headers.host + '/default');
                    html = html.replace(/{TITLE}/g, manifest.title);
                    html = html.replace(/{DESCRIPTION}/g, manifest.description);
                    html = html.replace(/{SYSTEM}/g, 'ios');
                    html = html.replace(/{TYPE}/g, 'phone');
                    html = html.replace(/{ORIENTATION}/g, 'portrait');
                    html = html.replace(/{VERSION}/g, manifest.version + '.' + manifest.build);
                    html = html.replace(/{COPYRIGHT}/g, manifest.copyright);
                    html = html.replace(/{APP_ID}/g, appID);
                    res.set('Content-Type', 'text/html');
                    res.end(html);
                });
                return;
            }
        };
        var tpl = {};
        var reader = function (list, i, cb) {
            if (!list[i]) return cb();
            var obj = list[i];
            for (var el in obj) fs.readFile(obj[el], function (e, r) {
                if (r) tpl[el] = r.toString('utf-8');
                reader(list, i + 1, cb);
            });
        };
        if (!manifest.bootstrap) manifest.bootstrap = "";
        var list = [{
            "html": global.PROJECT_HOME + sep + '.template'
        }, {
            "style": global.PROJECT_HOME + sep + '.style'
        }, {
            "json": global.PROJECT_HOME + sep + '.template.config'
        }, {
            "boot": __dirname + sep + '..' + sep + '..' + sep + 'tpl' + sep + 'oa' + sep + 'bootstrap' + manifest.bootstrap + '.tpl'
        }];

        reader(list, 0, function () {

            var _bt = tpl.boot;
            var _favicon = tpl.favicon;
            var _style = tpl.style;
            // conf
            eval(tpl.json);
            ///
            _style += '\t.omneedia-overlay{z-index: 9999999999;position:absolute;left:0px;top:0px;width:100%;height:100%;display:none;}\n';

            //
            if (manifest.platform == "mobile") {
                var ua = req.headers['user-agent'];
                if (/Windows NT/.test(ua)) os_type = "browser";
                if (/(Intel|PPC) Mac OS X/.test(ua)) os_type = "browser";
                else if (/like Mac OS X/.test(ua)) os_type = "ios";
                if (/Android/.test(ua)) os_type = "android";
                if (os_type == "browser") var cordova = '<script src="cordova.js"></script>';
                else var cordova = '';
                tpl.html = tpl.html.split('</head>')[0] + '<base href="' + req.protocol + '://' + req.get('host') + '">' + cordova + '<link rel="icon" href="/favicon.ico" type="image/x-icon"/><link rel="shortcut" href="/favicon.ico" type="image/x-icon"/><style>' + _style + "</style>" + tpl.boot + "</head>" + tpl.html.split('</head>')[1];
            } else
                tpl.html = tpl.html.split('</head>')[0] + '<base href="' + req.protocol + '://' + req.get('host') + '">' + '<link rel="icon" href="/favicon.ico" type="image/x-icon"/><link rel="shortcut" href="/favicon.ico" type="image/x-icon"/><style>' + _style + "</style>" + tpl.boot + "</head>" + tpl.html.split('</head>')[1];

            for (var el in conf) {
                if (el != "assets") {
                    var replace = '{' + el + '}';
                    var re = new RegExp(replace, 'g');
                    tpl.html = tpl.html.replace(re, conf[el]);
                }
            };
            for (var ii = 0; ii < conf.assets.length; ii++) {
                if (conf.assets[ii].name) {
                    var replace = '{' + conf.assets[ii].name + '}';
                    var re = new RegExp(replace, 'g');
                    tpl.html = tpl.html.replace(re, conf.assets[ii].dest);
                }
            };
            tpl.html = tpl.html.replace(/{TITLE}/g, manifest.title);
            tpl.html = tpl.html.replace(/{DESCRIPTION}/g, manifest.description);
            tpl.html = tpl.html.replace(/{APP_ID}/g, appID);

            var minify = require('html-minifier').minify;
            res.set('Content-Type', 'text/html');
            res.end(minify(tpl.html.replace(/\t/g, '').replace(/\n/g, '')));
        });
    },
    start: function (manifest) {
        var me = this;
        var fs = require('fs');
        var sep = "/";
        var path = require('path');
        var emojic = require("emojic");

        var chalk = require('chalk');

        console.log('\n\t' + emojic.whiteCheckMark + '  Starting server');
        global.getIPAddress = function () {
            var interfaces = require('os').networkInterfaces();
            for (var devName in interfaces) {
                var iface = interfaces[devName];
                for (var i = 0; i < iface.length; i++) {
                    var alias = iface[i];
                    if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) return alias.address;
                }
            }
            return '127.0.0.1';
        };

        function freeport(cb) {
            var net = require('net');
            var server = net.createServer(),
                port = 0
            server.on('listening', function () {
                port = server.address().port
                server.close()
            });
            server.on('close', function () {
                cb(null, port)
            });
            server.listen(0);
        };

        console.log('');

        // Create HTTP instance
        var express = require('express');
        var app = express();

        // Secure Express
        var helmet = require('helmet');
        app.use(helmet({
            frameguard: {
                action: 'sameorigin'
            }
        }));

        var expressDefend = require('express-defend');

        app.use(expressDefend.protect({
            maxAttempts: 5, // (default: 5) number of attempts until "onMaxAttemptsReached" gets triggered 
            dropSuspiciousRequest: true, // respond 403 Forbidden when max attempts count is reached 
            consoleLogging: true, // (default: true) enable console logging 
            //            logFile: 'suspicious.log', // if specified, express-defend will log it's output here 
            onMaxAttemptsReached: function (ipAddress, url) {
                console.log('IP address ' + ipAddress + ' is considered to be malicious, URL: ' + url);
            }
        }));

        const trustproxy = require('trustproxy');

        app.set('trust proxy', trustproxy(['loopback', 'linklocal', 'uniquelocal']));

        var http = require('http').createServer(app);

        // CORS middleware
        //app.use(require('cors')());

        // ERROR HANDLER
        app.use(require('errorhandler')({
            dumpExceptions: true,
            showStack: true
        }));

        // DEBUG mode

        if (process.args.debug) app.use(require('morgan')('dev'));

        function doStart(app) {

            app.IO.on('connection', function (socket) {
                var response = {
                    omneedia: {
                        engine: global.$_VERSION
                    },
                    session: socket.id,
                    pid: global._SESSION_
                };

                global.OASocketonAuth = function (response) {
                    var r = JSON.parse(response);
                    /*
                    if (!Clients.uid[r.uid]) Clients.uid[r.uid] = [];
                    if (!Clients.mail[r.mail]) Clients.mail[r.mail] = [];
                    if (Clients.uid[r.uid].indexOf(socket.id) == -1) Clients.uid[r.uid].push(socket.id);
                    if (Clients.mail[r.mail].indexOf(socket.id) == -1) Clients.mail[r.mail].push(socket.id);*/
                    app.IO.sockets.to(socket.id).emit("#auth", response);
                };
                global.OASocketonFailedAuth = function (response) {
                    app.IO.sockets.to(socket.id).emit("#failedauth", response);
                };
                socket.on('#create', function (room) {
                    console.log("- " + room + " joined.");
                    socket.join(room);
                });
                socket.on('#send', function (o) {
                    o = JSON.parse(o);
                    console.log(o);
                    if (!o.users) {
                        // on envoie qu'à la session en cours
                        app.IO.sockets.to(socket.id).emit(o.uri, o.data);
                    } else {
                        if (Object.prototype.toString.call(o.users) === '[object Array]') {
                            // on envoie qu'aux sockets des élus
                            for (var i = 0; i < o.users.length; i++) {
                                var _id = o.users[i];
                                if (Clients.uid[_id]) {
                                    var tab = Clients.uid[_id];
                                    for (var j = 0; j < tab.length; j++) {
                                        app.IO.sockets.to(tab[j]).emit(o.uri, o.data);
                                    }
                                };
                                if (Clients.mail[_id]) {
                                    var tab = Clients.mail[_id];
                                    for (var j = 0; j < tab.length; j++) app.IO.sockets.to(tab[j]).emit(o.uri, o.data);
                                };
                            };
                        } else {
                            if (o.users == "*") {
                                // on broadcast à tout le monde connecté à l'application
                                app.IO.sockets.emit(o.uri, o.data);
                            }
                        }
                    };
                });
                socket.emit('session', JSON.stringify(response));
            });

            // Upload
            var bodyParser = require('body-parser');

            app.use(bodyParser.json({
                limit: '5000mb',
                extended: true
            }));

            app.use(bodyParser.urlencoded({
                limit: '5000mb',
                extended: true
            }));

            app.use(bodyParser.json());

            app.UPLOAD = multer({
                storage: storage
            });

            // cookie parser
            var cookieParser = require('cookie-parser');
            app.use(cookieParser('0mneediaRulez!'));

            app.get('/i18n', function (req, res) {
                res.set("Content-Type", 'application/javascript');
                res.send(req.headers['accept-language'].split(';')[0]);
            });

            // i18n (internationalization)

            app.post('/i18n', function (req, res) {
                res.set("Content-Type", 'application/javascript');
                var url0 = req.body.url0;
                var url1 = req.body.url1;
                var url2 = manifest.langs[0];
                if (manifest.langs[0].indexOf('-') > -1) var url3 = -1;
                else var url3 = manifest.langs[0] + '-' + manifest.langs[0].toUpperCase();
                if (url0.indexOf('http') == -1) url0 = req.protocol + '://' + req.get('host') + url0;
                if (url1 != "-1") {
                    if (url1.indexOf('http') == -1) url1 = req.protocol + '://' + req.get('host') + url1;
                };
                if (url2.indexOf('http') == -1) url2 = req.protocol + '://' + req.get('host') + url2;
                if (url3 != "-1") {
                    if (url3.indexOf('http') == -1) url3 = req.protocol + '://' + req.get('host') + url3;
                };
                global.request(url0, function (e, r, b) {
                    if ((e) || (r.statusCode != 200)) {
                        if (url1 != -1) {
                            global.request(url1, function (e, r, b) {
                                if ((e) || (r.statusCode != 200)) {
                                    // fallback to default
                                    global.request(url2, function (e, r, b) {
                                        if ((e) || (r.statusCode != 200)) {
                                            if (url3 != -1) {
                                                global.request(url3, function (e, r, b) {
                                                    if ((e) || (r.statusCode != 200)) return res.end('');
                                                    res.end(b.toString('utf-8'));
                                                });
                                            } else res.end('');
                                        } else res.end(b.toString('utf-8'));
                                    });
                                } else res.end(b.toString('utf-8'));
                            });
                        } else res.end('');
                    } else res.end(b.toString('utf-8'));
                });
            });
            app.get('/Contents/Culture/:lang', function (req, res) {
                var fs = require('fs');
                res.set("Content-Type", 'application/javascript');
                var lang = req.params.lang.split('.js')[0];
                var dir = global.PROJECT_CULTURE + '/' + lang + '.js';
                fs.readFile(dir, function (e, r) {
                    if (r) return res.end(r.toString('utf-8') + ';');
                    if (e) {
                        var dir = global.PROJECT_CULTURE + '/' + lang + '.json';
                        fs.readFile(dir, function (e, r) {
                            if (e) {
                                var dir = global.PROJECT_CULTURE + '/' + manifest.langs[0] + '.json';
                                fs.readFile(dir, function (e, r) {
                                    if (e) {
                                        var dir = global.PROJECT_CULTURE + '/' + manifest.langs[0] + '.js';
                                        fs.readFile(dir, function (e, r) {
                                            if (r) return res.end(r.toString('utf-8') + ';');
                                            else return res.end(' ');
                                        });
                                    };
                                    if (lang.indexOf('-') > -1) {
                                        var a = lang.split('-')[0].toLowerCase();
                                        var b = lang.split('-')[1].toUpperCase();
                                        lang = a + '-' + b;
                                    };
                                    return res.end('i18n["' + lang + '"]=Object.assign(i18n["' + lang + '"],' + r.toString('utf-8') + ');');
                                });
                            };
                            if (r) {
                                if (lang.indexOf('-') > -1) {
                                    var a = lang.split('-')[0].toLowerCase();
                                    var b = lang.split('-')[1].toUpperCase();
                                    lang = a + '-' + b;
                                };
                                return res.end('i18n["' + lang + '"]=Object.assign(i18n["' + lang + '"],' + r.toString('utf-8') + ');');
                            }
                        });
                    };
                });
            });

            // db script 
            require('./db')(express, app);

            /*app.get('/z/(*)', function (req, res) {
                res.set('Content-Type', 'text/html');
                if (req.url.split('/z/').length == 0) return res.status(405).end('METHOD_NOT_ALLOWED');
                if (!req.headers.referer) return res.status(405).end('METHOD_NOT_ALLOWED');
                req.session.fingerprint = req.url.split('/z/')[1];
                req.session.save(function () {
                    res.end('<script>parent.z="' + req.session.fingerprint + '";parent.BOOTSTRAP_ME();</script>');
                });
            });*/

            // bootstrap script
            app.get('/favicon.ico', function (req, res) {
                var IM = require("jimp");
                IM.read(global.PROJECT_HOME + sep + manifest.icon.file, function (err, img) {
                    img.resize(16, 16).getBuffer(IM.MIME_PNG, function (err, buffer) {
                        res.set("Content-Type", 'image/x-icon');
                        res.send(buffer);
                    });
                });
            });
            app.get('/Contents/Resources/webapp/:img', function (req, res) {
                var IM = require("jimp");
                var temoin = false;
                fs.readFile(global.PROJECT_HOME + sep + 'src' + sep + '/Contents/Resources/webapp/' + req.params.img, function (err, body) {
                    if (err) {
                        fs.readFile(global.PROJECT_HOME + sep + '.template.config', function (err, body) {
                            eval(body.toString('utf-8'));
                            for (var i = 0; i < conf.assets.length; i++) {
                                if (conf.assets[i].dest == "Contents/Resources/webapp/" + req.params.img) {
                                    var p = i;
                                    temoin = true;
                                    IM.read(conf.assets[i].src, function (err, img) {
                                        if (err) return res.status(404).end('NOT_FOUND');
                                        if (conf.assets[p].transform.resize) {
                                            var values = conf.assets[p].transform['resize'].split(',');
                                            img.resize(values[0] * 1, values[1] * 1).getBuffer(IM.MIME_PNG, function (err, buffer) {
                                                res.set("Content-Type", 'image/png');
                                                return res.send(buffer);
                                            });
                                        }
                                    });
                                }
                            };
                            if (!temoin) res.status(404).send('NOT_FOUND');
                        });
                    } else res.send(body);
                });
            });
            app.get('/', me.display_index);

            app.get('/index.html', me.display_index);
            app.get('/index.htm', me.display_index);
            app.get('/default', me.display_index);
            app.get('/cordova-sw.js', function (req, res) {
                res.set('Content-Type', 'text/javascript');
                res.end('');
            });

            // MOBILE SPECIFIC
            if (manifest.platform == "mobile") require('./mobile.js')(app, express);

            // API
            require('./api.js')(app);

            // NOTIFICATION-CENTER
            require('./notification-center.js')(app);

            // Server process
            require('./system.js')(app, express);

            // AUTH

            require('./auth.js')(app);

            // request
            global.request = require('../framework/request');

            // compression
            app.use(require('compression')());

            var OS = require('os');
            var userdir = OS.homedir() + sep + "omneedia";

            var do_settings = require(__dirname + sep + '..' + sep + 'settings-client.js');
            do_settings(app);

            console.log(chalk.bold('  App started at ' + 'http://127.0.0.1:' + global.manifest.server.port) + '\n');
            var opn = require('opn');
            var browser = {};
            if (global.CFG.current) {
                var b = global.CFG.current['browser.default'];
                // a écrire et a tester pour windows et linux... Les racourcis ne sont pas les mêmes.
                if (b == "canary") browser.app = "google chrome canary";
                if (b == "google") browser.app = "google chrome";
                if (b == "chrome") browser.app = "google chrome";
                if (b == "safari") browser.app = "safari";
                if (b == "opera") browser.app = "opera";
                if (b == "firefoxdev") browser.app = "firefox developer edition";
            };
            if (_FIRST_TIME == 1) opn('http://127.0.0.1:' + global.manifest.server.port, browser).catch(function () {
                console.log('can\'t launch browser.');
            }).then(function () {
                console.log('Browser closed.');
            });

            http.listen(global.manifest.server.port);

        };

        // Session

        var OS = require('os');
        var userdir = OS.homedir() + sep + "omneedia";
        global.upload_dir = userdir + sep + "uploads";
        var multer = require('multer');
        var storage = multer.diskStorage({
            destination: function (req, file, cb) {
                var fs = require('fs');
                fs.mkdir(upload_dir, function () {
                    cb(null, upload_dir)
                });
            },
            filename: function (req, file, cb) {
                cb(null, Math.uuid() + file.originalname.substr(file.originalname.lastIndexOf('.'), file.originalname.length));
            }
        });

        // Session

        var session_dir = userdir + sep + "session";
        var Session = require('express-session');

        var SessionStore = require('session-file-store')(Session);
        // Local CDN
        var git_dir = userdir + sep + "omneedia.github.io";
        fs.mkdir(git_dir, function () {
            app.use('/cdn', express.static(git_dir));
            app.get('/cdn:(*)', function (req, res) {
                var uri = req.url.split('/cdn:')[1];
                var pos = uri.indexOf('/');
                var dd = uri.substr(pos, uri.length);
                uri = uri.replace(uri.substr(0, pos), git_dir + '/modules/' + uri.substr(0, pos));
                fs.stat(uri, function (e, r) {
                    if (e) {
                        var zuri = req.session.dir;
                        var pos = req.url.split('/cdn:')[1].indexOf('/');
                        var dd = req.url.split('/cdn:')[1].substr(pos, req.url.split('/cdn:')[1].length);
                        fs.readFile(zuri + dd + '.ts', function (e, r) {
                            res.end(r.toString('utf-8'));
                        });
                        return;
                    };
                    if (r.isDirectory()) {
                        req.session.dir = uri;
                        uri += "/index.ts";
                    } else {
                        uri = uri + '.ts';
                    }
                    fs.readFile(uri, function (e, r) {
                        res.end(r.toString('utf-8'));
                    });
                });



            });
        });


        app.use(express.static(PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Application'));
        app.use('/Contents/Culture', express.static(PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Culture'));
        app.use('/Contents/Application', express.static(PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Application'));
        app.use('/Contents/Resources', express.static(PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Resources'));


        fs.mkdir(session_dir, function () {
            var session = Session({
                store: new SessionStore({
                    path: session_dir
                }),
                secret: '0mneediaRulez!',
                resave: true,
                saveUninitialized: true
            });
            app.use(session);

            //   initialize socket.io
            app.IO = require('socket.io').listen(http);
            app.io = app.IO;

            var sharedsession = require("express-socket.io-session");

            app.IO.use(sharedsession(session, {
                autoSave: true
            }));

            doStart(app);
            //

        });

    }
}