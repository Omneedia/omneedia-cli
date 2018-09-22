module.exports = function (app) {
    var fs = require('fs');
    var path = require('path');
    var sep = "/";

    function processRoute(req, resp, next) {
        //console.info(req.headers);
        var fs = require('fs');
        var path = require('path');

        var parseFunction = require('@omneedia/parse-function')
        var parser = parseFunction({
            ecmaVersion: 2017
        });

        function process_api(d, i, batch, res) {
            if (!d[i]) return res.end(JSON.stringify(batch, 'utf8'));

            var api = d[i];
            try {
                var name = require.resolve(api.action);
                delete require.cache[name];
            } catch (e) {};
            if (!api.action) return resp.status(400).end('BAD_REQUEST');
            try {
                if (api.action == "__QUERY__") {
                    var x = require(global.ROOT + sep + "node_modules" + sep + "@omneedia" + sep + "db" + sep + api.action + ".js");
                } else
                    var x = require(global.PROJECT_API + sep + api.action + ".js");
                //x.fingerprint = req.session.fingerprint;
            } catch (e) {
                return resp.status(400).end('BAD_REQUEST');
            };
            x.auth = req.session.user;
            x.session = req.session;
            x.using = function (unit) {
                //built in classes
                if (unit == "db") return require(global.ROOT + sep + 'node_modules' + sep + '@omneedia' + sep + 'db' + sep + 'lib' + sep + 'index.js');
                if (unit == "scraper") return require(global.ROOT + sep + 'node_modules' + sep + '@omneedia' + sep + 'scraper' + sep + 'lib' + sep + 'index.js');
                if (unit == "mailer") return require(global.ROOT + sep + 'node_modules' + sep + '@omneedia' + sep + 'mailer' + sep + 'lib' + sep + 'index.js');
                try {
                    return require(global.ROOT + sep + 'node_modules' + sep + unit);
                } catch (e) {
                    return require(global.PROJECT_BIN + sep + 'node_modules' + sep + unit);
                };
            };
            // Upload
            x.file = {
                writer: function (ff, cbo) {
                    var set, db, tb;
                    var results = [];

                    function upload_blob(list, ndx, cb) {
                        if (!list[ndx]) {
                            cb();
                            return;
                        };
                        x.using('db').query(db, 'select docId from ' + tb + ' where docId="' + list[ndx].docId + '"', function (err, result) {
                            if (result.length > 0) {
                                // already uploaded
                                results.push({
                                    docId: list[ndx].docId,
                                    status: "ALREADY_UPLOADED"
                                });
                                upload_blob(list, ndx + 1, cb);
                            } else {
                                x.file.reader(list[ndx].docId, function (err, up) {
                                    up.docId = list[ndx].docId;
                                    up.filename = list[ndx].filename;
                                    x.using('db').post(db, tb, up, function (err, x) {
                                        if (err) results.push({
                                            docId: list[ndx].docId,
                                            status: "ERR",
                                            results: err
                                        });
                                        else results.push({
                                            docId: list[ndx].docId,
                                            status: "OK",
                                            results: x
                                        })
                                        upload_blob(list, ndx + 1, cb);
                                    });
                                });
                            }
                        });
                    };
                    if (!global.settings['docs']) return cb("DOCS_SETTINGS_REQUIRED", null);
                    if (!Array.isArray(ff)) ff = [ff];
                    set = global.settings['docs'][0];
                    db = set.split('://')[0];
                    tb = set.split('://')[1];
                    upload_blob(ff, 0, function () {
                        cbo(results);
                    });
                },
                reader: function (ff, cb) {
                    var fs = require('fs');
                    // If it's a string, the file is in the upload queue
                    // If it's an object, the file is in the cloud
                    if (cb.end) {
                        // via system
                        if (!ff) return cb.status(400).end("METHOD_NOT_ALLOWED", null);
                        if (!global.settings['docs']) return cb.status(400).end("DOCS_SETTINGS_REQUIRED", null);
                        if (!isObject(ff)) {
                            ff = {
                                docId: ff
                            }
                        };
                        // Check if the file is in the upload
                        if (!process.env.task) {
                            // debug
                            var path = global.upload_dir + sep + ff.docId;
                            fs.stat(path, function (e, stat) {
                                if (e) {
                                    // The file is not in the upload
                                    var set = global.settings['docs'][0];
                                    var db = set.split('://')[0];
                                    var tb = set.split('://')[1];
                                    x.using('db').query(db, 'select * from ' + tb + ' where docId="' + ff.docId + '"', function (e, r) {
                                        if (r.length == 0) return cb.status(404).end('NOT_FOUND');
                                        cb.set('Content-disposition', 'inline; filename="' + r[0].filename + '"');
                                        cb.set("Content-Type", r[0].type);
                                        cb.set("Content-Length", r[0].size);
                                        var buf = new Buffer(r[0]._blob.split(';base64,')[1], 'base64');
                                        cb.end(buf);
                                    });
                                } else {
                                    // Upload
                                    fs.readFile(path, function (err, buf) {
                                        if (err) cb.status(404).end('NOT_FOUND');
                                        else {
                                            var mime = require('mime-types')
                                            cb.set('Content-disposition', 'inline; filename="' + require('path').basename(path) + '"');
                                            cb.set("Content-Type", mime.lookup(require('path').basename(path)));
                                            cb.set("Content-Length", stat.size);
                                            cb.end(buf);
                                        }
                                    });
                                }
                            });
                        } else {
                            // prod

                        }
                    } else {
                        // via api
                        if (!global.settings['docs']) return cb("DOCS_SETTINGS_REQUIRED", null);
                        if (!isObject(ff)) {
                            ff = {
                                docId: ff
                            }
                        };
                        // Check if the file is in the upload
                        if (!process.env.task) {
                            // debug
                            var path = global.upload_dir + sep + ff.docId;
                            fs.stat(path, function (e, stat) {
                                if (e) {
                                    // The file is not in the upload
                                    var set = global.settings['docs'][0];
                                    var db = set.split('://')[0];
                                    var tb = set.split('://')[1];
                                    x.using('db').query(db, 'select * from ' + tb + ' where docId="' + ff.docId + '"', function (e, r) {
                                        if (r.length == 0) return cb('NOT_FOUND', null);
                                        cb(null, r[0]);
                                    });
                                } else {
                                    // Upload
                                    fs.readFile(path, function (err, buf) {
                                        if (err) cb('NOT_FOUND', null);
                                        else {
                                            var mime = require('mime-types');
                                            var response = {
                                                filename: require('path').basename(path),
                                                type: mime.lookup(require('path').basename(path)),
                                                size: stat.size,
                                                _blob: "data:" + mime.lookup(require('path').basename(path)) + ";base64," + buf.toString('base64')
                                            };
                                            cb(null, response);
                                        }
                                    });
                                }
                            });
                        } else {
                            //prod
                        }
                    };
                }
            };
            x.getFile = function (filename, cb) {
                return filename;
            };
            x.tmpdir = function (filename) {
                var OS = require('os');
                return OS.tmpdir();
            };
            x.temp = function (ext) {
                var uid = Math.uuid();
                var dir = x.tmpdir() + sep + "tempfiles";
                fs.mkdir(dir, function () {});
                var filename = uid;
                if (ext) filename += "." + ext;
                return {
                    uid: uid,
                    filename: filename,
                    dir: dir,
                    path: dir + sep + filename,
                    url: "/tmp/" + filename
                };
            };

            // Sockets API

            x.io = app.io;

            var myfn = parser.parse(x[api.method]);
            var response = {};
            response.params = myfn.args;
            var p = [];
            if (response.params.length > 1) {
                for (var e = 0; e < response.params.length - 1; e++) {
                    if (!api.data) return resp.status(400).end('BAD_REQUEST');
                    p.push(api.data[e]);
                };
            };
            p.push(function (err, response) {
                if (err) {
                    batch.push({
                        action: api.action,
                        method: api.method,
                        result: response,
                        message: err.message,
                        data: err,
                        tid: api.tid,
                        type: "rpc"
                    });
                } else {
                    err = null;
                    batch.push({
                        action: api.action,
                        method: api.method,
                        result: response,
                        tid: api.tid,
                        type: "rpc"
                    });
                };
                process_api(d, i + 1, batch, res);
            });
            try {
                x[api.method].apply({}, p);
            } catch (e) {
                batch.push({
                    type: 'exception',
                    action: api.action,
                    method: api.method,
                    message: e.message,
                    data: e
                });
                process_api(d, i + 1, batch, res);
            }

        };

        var data = req.body;

        var d = [];
        if (data instanceof Array) {
            d = data;
        } else {
            d.push(data);
        };

        process_api(d, 0, [], resp);
    };

    var sqlinjection = function (req, res, next) {
        var headers = req.headers.cookie.split('; ');
        var cookie_header = -1;
        /*for (var i = 0; i < headers.length; i++) {
            if (headers[i].indexOf('z=') > -1) cookie_header = headers[i].split('z=')[1];
        };*/
        //if (!req.session.fingerprint) return res.status(401).end('UNAUTHORIZED');
        /*if (!req.headers.z) {
            if (cookie_header != req.session.fingerprint) return res.status(401).end('UNAUTHORIZED');
        } else {
            if (req.session.fingerprint != req.headers.z) return res.status(401).end('UNAUTHORIZED');
        };*/

        function hasSql(value) {

            if (value === null || value === undefined) {
                return false;
            }

            // sql regex reference: http://www.symantec.com/connect/articles/detection-sql-injection-and-cross-site-scripting-attacks
            var sql_meta = new RegExp('(%27)|(--)|(%23)', 'i');
            if (sql_meta.test(value)) {
                /*console.log('-0---');
                console.log(value);
                console.log('----');*/
                return true;
            }

            var sql_meta2 = new RegExp('((%3D)|(=))[^\n]*((%27)|(\')|(--)|(%3B)|(;))', 'i');
            if (sql_meta2.test(value)) {
                /*console.log('-1---');
                console.log(value);
                console.log('----');*/
                return true;
            }

            var sql_typical = new RegExp('w*((%27)|(\'))((%6F)|o|(%4F))((%72)|r|(%52))', 'i');
            if (sql_typical.test(value)) {
                /*console.log('-2---');
                console.log(value);
                console.log('----');*/
                return true;
            }

            var sql_union = new RegExp('((%27)|(\'))union', 'i');
            if (sql_union.test(value)) {
                return true;
            }

            return false;
        };

        var containsSql = false;

        function iterate(obj) {
            var walked = [];
            var stack = [{
                obj: obj,
                stack: ''
            }];
            while (stack.length > 0) {
                var item = stack.pop();
                var obj = item.obj;
                for (var property in obj) {
                    if (obj.hasOwnProperty(property)) {
                        if (typeof obj[property] == "object") {
                            var alreadyFound = false;
                            for (var i = 0; i < walked.length; i++) {
                                if (walked[i] === obj[property]) {
                                    alreadyFound = true;
                                    break;
                                }
                            }
                            if (!alreadyFound) {
                                walked.push(obj[property]);
                                stack.push({
                                    obj: obj[property],
                                    stack: item.stack + '.' + property
                                });
                            }
                        } else {
                            if (hasSql(property)) return true;
                            if (hasSql(obj[property])) return true;
                        }
                    }
                }
            }
        };
        if (req.originalUrl !== null && req.originalUrl !== undefined) {
            if (hasSql(req.originalUrl) === true) {
                containsSql = true;
            };
            if (!req.body.length) {
                containsSql = iterate(req.body);
            } else {
                for (var i = 0; i < req.body.length; i++) {
                    var item = req.body[i];
                    containsSql = iterate(item);
                };
            }
        };

        if (containsSql) return res.status(403).end('SQL_INJECTION');
        next();
    };

    app.post('/api', sqlinjection, processRoute);

    app.get('/api', function (req, res) {
        var fs = require('fs');
        var response = {
            omneedia: {
                engine: global.$_VERSION
            },
            namespace: global.manifest.namespace,
            classes: []
        };

        fs.readdir(global.PROJECT_WEB + sep + "Contents" + sep + "Services", function (e, classes) {
            if (e) return res.status(404).send('Not found');
            var myclass = [];
            for (var i = 0; i < classes.length; i++) {
                if ((classes[i] != "node_modules") && (classes[i] != "sql") && (classes[i].substr(0, 1) != ".")) myclass.push(classes[i].split('.js')[0]);
            };
            response.classes = myclass;
            res.header("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(response, null, 4));
        })
    });
    app.get('/api/:ns', function (req, res) {
        var url = req.url.split('?');
        if (url.length > 1) {
            if (url[1].indexOf("javascript") > -1) {
                var REMOTE_API = {};
                REMOTE_API.url = "http://" + req.headers.host + "/api";
                REMOTE_API.type = "remoting";
                REMOTE_API.namespace = "App";
                REMOTE_API.descriptor = "App.REMOTING_API";
                REMOTE_API.actions = {};
                REMOTE_API.actions[req.params.ns] = [];

                if (req.params.ns.indexOf("__QUERY__") == -1) {
                    // MicroAPI
                    fs.stat(PROJECT_WEB + sep + "Contents" + sep + "Services" + sep + req.params.ns + ".js", function (e, s) {
                        if (e) return res.status(404).send('Not found');
                        try {
                            var _api = require(PROJECT_WEB + sep + "Contents" + sep + "Services" + sep + req.params.ns + ".js");
                        } catch (e) {
                            return res.status(404).send('Not found');
                        };
                        for (var e in _api) {
                            if (_api[e]) {
                                if (_api[e].toString().substr(0, 8) == "function") {
                                    var obj = {};
                                    obj.name = e;
                                    var myfn = _api[e].toString().split('function')[1].split('{')[0].trim().split('(')[1].split(')')[0].split(',');
                                    obj.len = myfn.length - 1;
                                    REMOTE_API.actions[req.params.ns][REMOTE_API.actions[req.params.ns].length] = obj;
                                }
                            }
                        };
                        /*REMOTE_API.headers = {
                            z: "%FINGERPRINT%"
                        };*/
                        var str = "if (Ext.syncRequire) Ext.syncRequire('Ext.direct.Manager');Ext.namespace('App');";
                        str += "App.REMOTING_API=" + JSON.stringify(REMOTE_API, null).replace(/"%FINGERPRINT%"/g, "window.z") + ";";
                        str += "Ext.Direct.addProvider(App.REMOTING_API);";
                        res.header("Content-Type", "application/json; charset=utf-8");
                        res.end(str);
                    });
                } else {
                    // QRL (Query Resource Locator)

                    fs.stat(__dirname + sep + '..' + sep + '..' + sep + "node_modules" + sep + '@omneedia' + sep + "db" + sep + "__QUERY__.js", function (e, s) {
                        if (e) return res.status(404).send('Not found');

                        var _api = require(__dirname + sep + '..' + sep + '..' + sep + "node_modules" + sep + '@omneedia' + sep + "db" + sep + "__QUERY__.js");
                        for (var e in _api) {
                            if (_api[e]) {
                                if (_api[e].toString().substr(0, 8) == "function") {
                                    var obj = {};
                                    obj.name = e;
                                    var myfn = _api[e].toString().split('function')[1].split('{')[0].trim().split('(')[1].split(')')[0].split(',');
                                    obj.len = myfn.length - 1;
                                    REMOTE_API.actions[req.params.ns][REMOTE_API.actions[req.params.ns].length] = obj;
                                }
                            }
                        };
                        /*REMOTE_API.headers = {
                            z: "%FINGERPRINT%"
                        };*/
                        var str = "if (Ext.syncRequire) Ext.syncRequire('Ext.direct.Manager');Ext.namespace('App');";
                        str += "App.REMOTING_API=" + JSON.stringify(REMOTE_API, null).replace(/"%FINGERPRINT%"/g, "window.z") + ";";
                        str += "Ext.Direct.addProvider(App.REMOTING_API);";
                        res.header("Content-Type", "application/json; charset=utf-8");
                        res.end(str);

                    });
                };
            } else return res.status(404).send('Not found');
        } else return res.status(404).send('Not found');
    });
}