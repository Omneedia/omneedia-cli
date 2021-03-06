module.exports = function (app, express) {
    var path = require('path');
    var sep = "/";
    var OS = require('os');

    var Manifest = global.manifest;

    //app.use(express.static(OS.tmpdir() + sep + 'tempfiles'));

    var _App = require(global.PROJECT_SYSTEM + sep + "app.js");

    _App.file = {
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

                // debug
                var path = global.upload_dir + sep + ff.docId;
                fs.stat(path, function (e, stat) {
                    if (e) {
                        // The file is not in the upload
                        var set = global.settings['docs'][0];
                        var db = set.split('://')[0];
                        var tb = set.split('://')[1];
                        console.log('select * from ' + tb + ' where docId="' + ff.docId + '"');
                        _App.using('db').query(db, 'select * from ' + tb + ' where docId="' + ff.docId + '"', function (e, r) {
                            console.log(r);
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
                // via api
                if (!global.settings['docs']) return cb("DOCS_SETTINGS_REQUIRED", null);
                if (!isObject(ff)) return cb("MISMATCHED_OBJECT", null);
                if (!isObject(ff)) {
                    ff = {
                        docId: ff
                    }
                };
                // Check if the file is in the upload

                // debug
                var path = global.upload_dir + sep + ff.docId;
                fs.stat(path, function (e, stat) {
                    if (e) {
                        // The file is not in the upload
                        var set = global.settings['docs'][0];
                        var db = set.split('://')[0];
                        var tb = set.split('://')[1];
                        _App.using('db').query(db, 'select * from ' + tb + ' where docId="' + ff.docId + '"', function (e, r) {
                            if (r.length == 0) return cb('NOT_FOUND', null);
                            cb.end(null, JSON.stringify(r[0]));
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
                                    _blob: "data:application/pdf;base64," + buf.toString('base64')
                                };
                                cb.end(null, JSON.stringify(response));
                            }
                        });
                    }
                });

            };
        }
    };

    app.upload = function (root, cb) {
        app.post(root, app.UPLOAD.any(), function (req, res, next) {

            if (!req.files) return cb("UPLOAD_FAILED", null);
            if (req.files.length == 0) {
                if (cb) return cb(req, res, null, []);
                else return false;
            };
            var o = {
                id: [],
                file: req.files[0]
            };
            o.id = req.files[0].filename;
            if (!cb) return res.end(JSON.stringify(o.id));
            return cb(req, res, null, o);
        });
    }

    _App.tmpdir = function (filename) {
        var OS = require('os');
        return OS.tmpdir();
    };

    _App.temp = function (ext) {
        var uid = Math.uuid();
        var dir = _App.tmpdir() + sep + "tempfiles";
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

    _App.cors = require('cors');

    _App.using = function (unit) {
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

    _App.api = require(global.ROOT + sep + 'node_modules' + sep + "@omneedia" + sep + "api");

    for (var i = 0; i < Manifest.api.length; i++) {
        if (Manifest.api[i].indexOf('@') == -1) {

            _App[Manifest.api[i]] = require(global.PROJECT_API + sep + Manifest.api[i] + '.js');
            var self = _App[Manifest.api[i]].model = {
                _model: {
                    "type": "raw",
                    "metaData": {
                        "idProperty": -1,
                        "totalProperty": "total",
                        "successProperty": "success",
                        "root": "data",
                        "fields": []
                    },
                    "total": 0,
                    "data": [],
                    "success": false,
                    "message": "failure"
                },
                init: function () {
                    self._model.metaData.fields = [];
                    self._model.data = [];
                    self._model.success = false;
                    self._model.message = "failure";
                },
                fields: {
                    add: function (o) {
                        if (o === Object(o))
                            self._model.metaData.fields.push(o);
                        else {
                            var t = o.split(',');
                            if (t.length == 3) {
                                var o = {
                                    name: t[0],
                                    type: t[1],
                                    length: t[2]
                                };
                            } else {
                                var o = {
                                    name: o,
                                    type: 'string',
                                    length: 255
                                };
                            };
                            self._model.metaData.fields.push(o);
                        }
                    }
                },
                data: {
                    add: function (o) {
                        self._model.data.push(o);
                        self._model.total = self._model.data.length;
                    }
                },
                get: function () {
                    self._model.success = true;
                    self._model.message = "success";
                    return self._model;
                }
            };
            // deprecated
            //_App[Manifest.api[i]].DB = require(global.ROOT + sep + 'node_modules' + sep + "@omneedia" + sep + "db" +sep + "DB.js");
            //_App[Manifest.api[i]].DB = require(global.ROOT + sep + 'node_modules' + sep + "@omneedia" + sep + "db" + sep + "lib" + sep + "index.js");
            _App[Manifest.api[i]].IO = {
                send: function (uri, data, users) {
                    var o = {
                        uri: uri,
                        data: data,
                        users: users
                    };
                    var socket = require('socket.io-client')(global.registry.uri);
                    if (uri.indexOf("#") > -1) socket.emit("#send", JSON.stringify(o));
                }
            };
            _App[Manifest.api[i]].using = function (unit) {
                return require(global.ROOT + sep + 'node_modules' + sep + unit);
            };

            if (!process.env.task) {
                var setmeup = require('../settings');
                setmeup.update(global.manifest, function (settings) {
                    if (settings.config) app.config = settings.config;
                    if (settings.db) app.db = settings.db;
                    if (settings.auth) app.auth = settings.auth;
                    _App.init(app, express);
                });
            } else {
                if (global.settings.config) app.config = global.settings.config;
                if (global.settings.db) app.db = global.settings.db;
                if (global.settings.auth) app.auth = global.settings.auth;
                _App.init(app, express);
            }

        };
    };
}