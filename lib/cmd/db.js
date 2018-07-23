module.exports = function () {
    var INSTALL = [
        'https://github.com/Omneedia/mysql-server/raw/master/mysql-server-win64.zip',
        'https://github.com/Omneedia/mysql-server/raw/master/mysql-server-win32.zip',
        'https://github.com/Omneedia/mysql-server/raw/master/mysql-server-macos.zip'
    ];
    var OS = require('os');
    var path = require('path');
    var sep = "/";
    var fs = require('fs');
    var shelljs = require('shelljs');

    var util = require('../util');
    require('../globals');
    Array = require('../framework/arrays')();

    var root = __dirname + sep + '..' + sep + '..';
    var isWin = /^win/.test(process.platform);

    var userdir = OS.homedir() + sep + "omneedia";
    var userdirdata = userdir + sep + "db";

    var setup = require('../settings');

    var pos = process.argv.indexOf('db') + 1;
    var def = process.argv[pos];

    //    var pro = process.argv[pos + 1];
    //    if (!pro) 
    var pro = "default";

    userdirdata += sep + pro;
    var data = userdirdata + sep + "data";

    function mysql_stop() {
        var pid = userdirdata + sep + ".pid";
        fs.readFile(pid, function (e, r) {
            if (e) return console.log('\n\t! mySQL server seems not running\n'.red);

            function displaymsg() {
                fs.unlink(pid, function () {
                    console.log('\n\t- mySQL service stopped.\n'.green);
                });
            };

            var PID = r.toString('utf-8');
            if (!isWin) {
                shelljs.exec('kill -9 ' + PID, {
                    silent: true
                });
                fs.unlink(pid, displaymsg);
            } else {
                shelljs.exec('taskkill /F /PID ' + PID, {
                    silent: true
                });
                fs.unlink(pid, displaymsg);
            };
        });
    };

    function mysql_start() {
        if (!isWin) {
            var pid = userdirdata + sep + ".pid";
            shelljs.exec('nohup "' + root + sep + 'mysql' + sep + 'bin' + sep + 'mysqld" --defaults-file="' + userdirdata + sep + 'my.ini" --log-bin="' + data + '/binlog" -b "' + root + sep + 'mysql" --datadir="' + data + '" &>"' + userdirdata + sep + "my.log" + '" & echo $! > "' + pid + '"', {
                silent: true
            }, function () {
                fs.readFile(pid, function (e, r) {
                    var pido = r.toString('utf-8');
                    fs.writeFile(pid, pido.trim(), function () {
                        var msg = '\n\t- mySQL server running [PID ' + pido.trim() + ']\n';
                        console.log(msg.green);
                    });
                });
            });
        } else {
            var pid = userdirdata + path.sep + ".pid";
            var _cmd = root + path.sep + 'mysql' + path.sep + 'bin' + path.sep + 'mysqld --defaults-file=' + userdirdata + path.sep + 'my.ini -b ' + root + path.sep + 'mysql --datadir=' + data;
            var cmd = 'start /b ' + _cmd;
            fs.writeFileSync(userdirdata + path.sep + 'mysql.cmd', cmd);
            shelljs.exec(userdirdata + path.sep + 'mysql.cmd', {
                silent: true
            });
            shelljs.exec("Wmic /output:\"" + pid + "\" process where (CommandLine like '%mysqld%') get Name,CommandLine,ProcessId", {
                silent: true
            });
            var _pid = fs.readFileSync(pid, 'ucs2').split('\r\n');
            var pido = -1;
            for (var i = 0; i < _pid.length; i++) {
                if (_pid[i].indexOf("my.ini") > -1) var pido = i;
            };
            if (pido != -1) {
                pido = _pid[pido].substr(_pid[pido].lastIndexOf('mysqld.exe') + 11, 255).trim();
                fs.writeFileSync(pid, pido);
                var msg = '\t- mySQL server running [PID ' + pido + ']\n';
                console.log(msg.green);
            } else {
                var msg = '\t! mySQL not running\n';
                console.log(msg.yellow);
            }
        }
    }

    function mysql_create() {
        var pos = process.argv.indexOf('create') + 1;
        var def = process.argv[pos];
        var name = process.argv[pos + 1];
        if (!name) name = def;
        if (!def) return util.error('You must provide a database name');
        var mysql = require('mysql2');
        var ini = userdirdata + sep + 'my.ini';
        fs.mkdir(global.PROJECT_DB, function (e) {
            fs.readFile(ini, function (e, r) {
                var conf = r.toString('utf-8').split('\n');
                var port = 3306;
                for (var i = 0; i < conf.length; i++) {
                    if (conf[i].indexOf('port=') > -1) port = conf[i].split('port=')[1] * 1;
                };
                var connection = mysql.createConnection('mysql://root@127.0.0.1:' + port + '/mysql');
                connection.query('CREATE DATABASE IF NOT EXISTS ' + def, function (error, results, fields) {
                    if (error) return util.error(error);

                    var msg = '\t- Database `' + def + '` created.';
                    console.log(msg.green);
                    connection.end(function (err) {

                        fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {

                            if (e) return;
                            try {
                                var manifest = JSON.parse(r.toString('utf-8'));
                                if (manifest.db.indexOf(name) == -1) manifest.db.push(name);
                                else util.error('This database link already exists.');

                                fs.writeFile(global.PROJECT_HOME + sep + 'app.manifest', JSON.stringify(manifest, null, 4), function (e) {
                                    fs.readFile(global.PROJECT_ETC + sep + 'settings.json', function (e, r) {
                                        if (e) {
                                            var settings = {
                                                auth: {},
                                                db: []
                                            };
                                        };
                                        try {
                                            if (r) var settings = JSON.parse(r);
                                            if (!settings.db) settings.db = [];

                                            var t = -1;
                                            for (var i = 0; i < settings.db.length; i++) {
                                                if (settings.db[i].name == name) {
                                                    t = i;
                                                    settings.db[i] = {
                                                        name: name,
                                                        uri: 'mysql://root@127.0.0.1:' + port + '/' + def
                                                    }
                                                }
                                            };
                                            if (t == -1) settings.db.push({
                                                name: name,
                                                uri: 'mysql://root@127.0.0.1:' + port + '/' + def
                                            });

                                            fs.writeFile(global.PROJECT_ETC + sep + 'settings.json', JSON.stringify(settings, null, 4), function (e, r) {
                                                var msg = '\t- Database `' + def + '` linked to your project as `' + name + '`.\n';
                                                console.log(msg.green);
                                            });

                                        } catch (e) {
                                            util.error('Settings not readable');
                                        }
                                    });
                                });

                            } catch (e) {
                                util.error('Manifest not readable');
                            };
                        });
                    });
                });
            });
        });

    };

    function mysql_unlink() {
        var pos = process.argv.indexOf('unlink') + 1;
        var def = process.argv[pos];
        var name = def;
        if (!def) return util.error('You must provide a valid link');
        fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {
            try {
                var manifest = JSON.parse(r.toString('utf-8'));
                if (manifest.db.indexOf(def) == -1) util.error('Database link `' + def + '` not found');
                manifest.db.remove(def);
                fs.writeFile(global.PROJECT_HOME + sep + 'app.manifest', JSON.stringify(manifest, null, 4), function (e) {
                    fs.readFile(global.PROJECT_ETC + sep + 'settings.json', function (e, r) {
                        if (e) util.error('settings not found. try `oa update`');
                        try {
                            if (r) var settings = JSON.parse(r);
                            var t = -1;
                            for (var i = 0; i < settings.db.length; i++) {
                                if (settings.db[i].name == name) {
                                    delete settings.db.splice(i, 1);
                                    fs.writeFile(global.PROJECT_ETC + sep + 'settings.json', JSON.stringify(settings, null, 4), function (e, r) {
                                        var msg = '\t- Database `' + def + '` unlinked from your project.\n';
                                        console.log(msg.green);
                                    });
                                }
                            };
                        } catch (e) {
                            util.error('Settings not readable');
                        }
                    });
                });
            } catch (e) {
                util.error('Manifest not readable');
            }
        });
    };

    function mysql_link() {
        var pos = process.argv.indexOf('link') + 1;
        var name = process.argv[pos];
        var uri = process.argv[pos + 1];

        if (!name) return util.error('You must provide a valid link');
        if (!uri) return util.error('You must provide a valid uri to your database (mysql://user:password@host[:port]/database)');

        var mysql = require('mysql2');
        var connection = mysql.createConnection(uri);
        connection.connect(function (err) {
            if (err) {
                util.error('error connecting to your database');
                return;
            };

            fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {

                if (e) return;
                try {
                    var manifest = JSON.parse(r.toString('utf-8'));
                    if (manifest.db.indexOf(name) == -1) manifest.db.push(name);
                    else util.error('This database link already exists.');

                    fs.writeFile(global.PROJECT_HOME + sep + 'app.manifest', JSON.stringify(manifest, null, 4), function (e) {
                        fs.readFile(global.PROJECT_ETC + sep + 'settings.json', function (e, r) {
                            if (e) {
                                var settings = {
                                    auth: {},
                                    db: []
                                };
                            };
                            try {
                                if (r) var settings = JSON.parse(r);
                                if (!settings.db) settings.db = [];

                                var t = -1;
                                for (var i = 0; i < settings.db.length; i++) {
                                    if (settings.db[i].name == name) {
                                        t = i;
                                        settings.db[i] = uri
                                    }
                                };
                                if (t == -1) settings.db.push({
                                    name: name,
                                    uri: uri
                                });

                                fs.writeFile(global.PROJECT_ETC + sep + 'settings.json', JSON.stringify(settings, null, 4), function (e, r) {
                                    connection.end(function (err) {
                                        var msg = '\t- Database linked to your project as `' + name + '`.\n';
                                        console.log(msg.green);
                                    });
                                });

                            } catch (e) {
                                connection.end(function (err) {});
                                util.error('Settings not readable');
                            }
                        });
                    });

                } catch (e) {
                    connection.end(function (err) {});
                    util.error('Manifest not readable');
                };
            });
        });
    };

    function mysql_remove() {
        var pos = process.argv.indexOf('remove') + 1;
        var def = process.argv[pos];
        var name = process.argv[pos + 1];
        if (!name) name = def;
        if (!def) return util.error('You must provide a database name');
        var mysql = require('mysql2');
        var ini = userdirdata + sep + 'my.ini';

        fs.readFile(ini, function (e, r) {
            var conf = r.toString('utf-8').split('\n');
            var port = 3306;
            for (var i = 0; i < conf.length; i++) {
                if (conf[i].indexOf('port=') > -1) port = conf[i].split('port=')[1] * 1;
            };
            var connection = mysql.createConnection('mysql://root@127.0.0.1:' + port + '/mysql');
            connection.query('DROP DATABASE IF EXISTS ' + def, function (error, results, fields) {
                var msg = '\t- Database `' + def + '` removed.';
                console.log(msg.green);
                connection.end(function (err) {
                    fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {
                        if (e) return;
                        try {
                            var manifest = JSON.parse(r.toString('utf-8'));
                            if (manifest.db.indexOf(name) > -1) {
                                manifest.db.remove(name);
                            };

                            fs.writeFile(global.PROJECT_HOME + sep + 'app.manifest', JSON.stringify(manifest, null, 4), function (e) {
                                fs.readFile(global.PROJECT_ETC + sep + 'settings.json', function (e, r) {
                                    if (e) {
                                        var settings = {
                                            auth: {},
                                            db: []
                                        };
                                    };
                                    try {
                                        if (r) var settings = JSON.parse(r);

                                        var t = -1;
                                        for (var i = 0; i < settings.db.length; i++) {
                                            if (settings.db[i].name == name) {
                                                delete settings.db.splice(i, 1);
                                                fs.writeFile(global.PROJECT_ETC + sep + 'settings.json', JSON.stringify(settings, null, 4), function (e, r) {
                                                    var msg = '\t- Database `' + def + '` unlinked from your project.\n';
                                                    console.log(msg.green);
                                                });
                                            }
                                        };

                                    } catch (e) {
                                        util.error('Settings not readable');
                                    }
                                });
                            });

                        } catch (e) {
                            util.error('Manifest not readable');
                        };
                    });
                });
            });
        });
    };

    function mysql_update() {
        function _SDATA(item) {
            // map type to sequelize
            if (item == "int") return "DataTypes.INTEGER(11)";
            if (item == "string") return "DataTypes.STRING(255)";
            if (item == "datetime") return "DataTypes.DATE";
            if (item == "date") return "DataTypes.DATE";
            if (item == "float") return "DataTypes.FLOAT";
            if (item == "blob") return "DataTypes.BLOB";
            if (item == "boolean") return "DataTypes.BOOLEAN";
            if (item == "text") return "DataTypes.BLOB";
            if (item == "char") return "DataTypes.STRING(1)";
            if (item == "key") return "key";
            return false;
        };

        function update(settings, db, i, cb) {
            var Sequelize = require('sequelize');
            if (!db[i]) return cb();
            var setup = -1;
            for (var p = 0; p < settings.db.length; p++) {
                if (settings.db[p].name == db[i]) var setup = settings.db[p].uri;
            };
            if (setup == -1) return util.error('Config not found');
            console.log('\t- Database ' + db[i].cyan);
            var _IMPORT = {};

            var sequelize = new Sequelize(setup, {
                operatorsAliases: false,
                define: {
                    freezeTableName: true
                }
            });
            var dbo = db[i];
            var filename = global.PROJECT_DB + sep + dbo + '.scheme';
            fs.readFile(filename, function (e, texto) {
                //console.log(e);
                if (e) return update(settings, db, i + 1, cb);
                texto = texto.toString('utf-8').split('}');
                for (var ii = 0; ii < texto.length - 1; ii++) {

                    var maclasse = texto[ii].split('{')[0].trim();
                    var madata = texto[ii].split('{')[1];

                    if (madata) madata = madata.split('\n');
                    else madata = [];

                    madata.shift();
                    madata.pop();

                    var COM = [];
                    var XCOM = [];
                    COM.push("module.exports = function(sequelize, DataTypes) {");
                    COM.push("	return sequelize.define('" + maclasse + "', {");
                    var LINKS = [];

                    for (var j = 0; j < madata.length; j++) {

                        var mafield = madata[j].trim();
                        if (mafield) {
                            var matype = mafield.split(')')[0].split('(')[1];
                            var allownull = mafield.substr(0, 1);
                            if (allownull == "-") allownull = "true";
                            else allownull = "false";

                            mafield = mafield.split(')')[1];
                            mafield = mafield.replace(/\s/g, '');
                            var mytype = _SDATA(matype);
                            if (mytype) {
                                if (mafield != "") {
                                    if (mytype != "key") {
                                        COM.push("		" + mafield + ": {");
                                        COM.push("			type: " + _SDATA(matype) + ",");
                                        COM.push("			allowNull: " + allownull);
                                        COM.push("		},");
                                    } else {
                                        COM.push("		" + mafield + ": {");
                                        COM.push("			type: DataTypes.INTEGER(11),");
                                        COM.push("			autoIncrement: true,");
                                        COM.push("			primaryKey: true,");
                                        COM.push("			allowNull: false");
                                        COM.push("		},");
                                    }
                                }
                            } else {
                                if (matype.split(':')[1]) var type = matype.split(':')[1];
                                else var type = '1';
                                matype = matype.split(':')[0];

                                LINKS.push({
                                    from: maclasse,
                                    as: mafield,
                                    tb: matype,
                                    type: type
                                });

                            }
                        }
                    };
                    var ZCOM = COM;
                    ZCOM.push("	})");
                    ZCOM.push("};");
                    //console.log(LINKS);

                    var dbdir = global.PROJECT_DB + sep + dbo + '.db';
                    if (!fs.existsSync(dbdir)) fs.mkdirSync(dbdir);
                    fs.writeFileSync(dbdir + path.sep + maclasse + '.js', ZCOM.join('\n'));
                    //console.log(maclasse);
                    _IMPORT[maclasse] = sequelize.import(dbdir + path.sep + maclasse + '.js');
                    for (var k = 0; k < LINKS.length; k++) {
                        //console.log('T' + LINKS[k].from + LINKS[k].tb);
                        if (_IMPORT[LINKS[k].tb]) {
                            if (LINKS[k].type == '1') _IMPORT[maclasse].belongsTo(_IMPORT[LINKS[k].tb], {
                                as: LINKS[k].as
                            });
                            else _IMPORT[maclasse].belongsToMany(_IMPORT[LINKS[k].tb], {
                                through: 'T' + LINKS[k].from + '-' + LINKS[k].tb,
                                as: LINKS[k].as
                            });
                        }
                    };
                    console.log('\t\t- Creating ' + maclasse.cyan);
                    if (XCOM.length > 0) {
                        COM.splice(-1, 1);
                        COM.splice(-1, 1);
                    };
                    //for (var z = 0; z < XCOM.length; z++) COM.push(XCOM[z]);

                    var ZCOM = COM;
                    ZCOM.push("	})");
                    ZCOM.push("};");
                    if (XCOM.length > 0) fs.writeFileSync(dbdir + path.sep + maclasse + '.js', ZCOM.join('\n'));
                }
                sequelize.sync({
                    force: true,
                    logging: false
                }).then(function () {
                    sequelize.close();
                    console.log('\t\tOK.'.green);
                    update(settings, db, i + 1, cb);
                });

            });
        };
        fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {
            if (e) util.error('Manifest not found! Must be run under your project directory');
            try {
                var manifest = JSON.parse(r.toString('utf-8'));
                fs.readFile(global.PROJECT_ETC + sep + 'settings.json', function (e, r) {
                    if (e) util.error('Settings not found. Try oa update');
                    try {
                        var settings = JSON.parse(r.toString('utf-8'));
                        update(settings, manifest.db, 0, function () {
                            console.log('\tDone.\n');
                        });
                    } catch (e) {
                        console.log(e);
                        util.error('Settings not readable');
                    }
                });

            } catch (e) {
                util.error('Manifest not readable');
            }
        });
    };

    function process_db() {
        switch (def) {
            case "start":
                mysql_start();
                break;
            case "stop":
                mysql_stop();
                break;
            case "create":
                mysql_create();
                break;
            case "remove":
                mysql_remove();
                break;
            case "link":
                mysql_link();
                break;
            case "unlink":
                mysql_unlink();
                break;
            case "update":
                mysql_update();
                break;
            default:
        };
    };

    function init_db() {
        fs.stat(data + sep + "auto.cnf", function (e, r) {
            if (e) {
                console.log('\t- Init MySQL Server')
                shelljs.exec(root + sep + 'mysql' + sep + 'bin' + sep + 'mysqld --defaults-file="' + userdirdata + sep + 'my.ini" -b "' + __dirname + sep + 'mysql' + '" --datadir="' + data + '" --initialize-insecure', {
                    silent: true
                }, process_db);
            } else {
                process_db();
            }
        });
    };

    function conf_db() {
        var myini = [
            '[mysqld]',
            'sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES',
            'max_allowed_packet=160M',
            'innodb_force_recovery=0',
            'port=3306',
            'federated',
            'show_compatibility_56 = ON',
            'server-id = 1'
        ];
        fs.writeFile(userdirdata + sep + "my.ini", myini.join('\r\n'), init_db);
    }

    function install_mysql() {
        console.log('\n');
        var arch = OS.arch();

        if (OS.platform() == "darwin") var url = INSTALL[2];
        if (OS.platform() == "win32") {
            if (OS.arch() == "x64") var url = INSTALL[0];
            else var url = INSTALL[1];
        };

        var filename = path.resolve(root + sep + url.substr(url.lastIndexOf('/') + 1, url.length));

        function setmeup() {
            console.log('\n\tInstalling MySQL');
            var unzip = require('unzip-stream');
            fs.createReadStream(filename).pipe(unzip.Extract({
                path: path.dirname(filename)
            })).on('error', function () {
                fs.unlink(filename, install_mysql);
            }).on('close', function () {
                fs.unlink(filename, function () {
                    var arch = OS.arch();
                    if (OS.platform() == "darwin") {
                        shelljs.mv(root + sep + 'macos', root + sep + 'mysql');
                        shelljs.chmod(755, root + sep + 'mysql' + sep + 'bin' + sep + 'mysqld');
                        util.mkdir(data, conf_db);
                    };;
                    if (OS.platform() == "win32") {
                        if (OS.arch() == "x64") {
                            shelljs.mv(root + sep + 'win64', root + sep + 'mysql');
                            util.mkdir(data, conf_db);
                        } else {
                            shelljs.mv(root + sep + 'win32', root + sep + 'mysql');
                            util.mkdir(data, conf_db);
                        }
                    };
                });
            });
        };

        fs.stat(filename, function (e) {

            if (e) {
                var Request = {};
                var request = require('request');
                if (global.CFG.current.proxy) var Request = request.defaults({
                    'proxy': global.CFG.current.proxy
                });
                else Request = request;

                var progress = require('request-progress');
                var _progress = require('cli-progress');

                var bar1 = new _progress.Bar({
                    format: '\tDownload MySQL server [ {bar} ] {percentage}% | ETA: {eta}s'
                }, _progress.Presets.shades_classic);
                bar1.start(100, 0, {
                    speed: "N/A",
                    barCompleteChar: '\u2588',
                    barIncompleteChar: '\u2591'
                });

                progress(Request(url), {})
                    .on('progress', function (state) {

                        bar1.update(Math.trunc(state.percent * 100), {
                            speed: state.speed
                        });

                    })
                    .on('error', function (err) {

                        util.error(err);

                    })
                    .on('end', function () {
                        bar1.update(100, {
                            speed: 0
                        });
                        bar1.stop();
                        setmeup();
                    })
                    .pipe(fs.createWriteStream(filename));
            } else setmeup();
        });
    }
    util.mkdir(userdirdata, function () {

        fs.stat(root + sep + 'mysql' + sep + 'bin' + sep + 'mysqld', function (e) {
            if (e) {
                fs.stat(root + sep + 'mysql' + sep + 'bin' + sep + 'mysqld.exe', function (e) {
                    if (e) return install_mysql();
                    util.mkdir(data, conf_db);
                });
                return;
            };
            util.mkdir(data, conf_db);
        });

    });

}