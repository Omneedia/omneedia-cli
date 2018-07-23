module.exports = function () {

    var emojic = require('emojic');
    const chalk = require('chalk');
    var sep = "/";
    var path = require('path');
    var os = require('os');
    var fs = require('fs');
    var util = require('../util');
    var root = os.homedir() + sep + 'omneedia';
    var inquirer = require('inquirer');

    var REPO_TOKEN = -1;

    var nodegit = require('nodegit');

    require('../globals');
    var root = require('os').homedir() + sep + 'omneedia';
    var dir = global.PROJECT_HOME;

    if (!fs.existsSync(root)) fs.mkdirSync(root);
    var Console = global.CFG.console;
    var manager = global.CFG.manager;

    console.log(chalk.bold("Link your project."));
    console.log('You are about to link your project to Omneedia CI.')
    console.log('____________________\n')

    fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {
        if (e) util.error("Can't find app.manifest ... Must be run inside your project root.");
        var manifest = JSON.parse(r.toString('utf-8'));

        var build = manifest.build;
        var title = "Linked @ " + new Date().toMySQL();
        var RXPUSH = -1;

        function prepare_db(cbo) {
            function dump_scheme(db, ndx, cb) {
                if (!db[ndx]) return cb();
                var mysql = require('mysql');
                var cx = mysql.createConnection(db[ndx].uri);
                var database = db[ndx].uri.substr(db[ndx].uri.lastIndexOf('/') + 1, db[ndx].uri.length);
                var sql = 'select * from information_schema.columns where table_schema="' + database + '"';
                var sql2 = 'select * from information_schema.KEY_COLUMN_USAGE where table_schema="' + database + '"';
                var scheme = {
                    db: database,
                    tables: [],
                    table: {}
                };
                cx.query(sql2, function (ee, rr) {
                    if (ee) util.error("Can't connect to database");

                    for (var i = 0; i < rr.length; i++) {
                        if (rr[i].CONSTRAINT_NAME == "PRIMARY") {
                            if (scheme.tables.indexOf(rr[i].TABLE_NAME) == -1) {
                                scheme.tables.push(rr[i].TABLE_NAME);
                                scheme.table[rr[i].TABLE_NAME] = {
                                    index: rr[i].COLUMN_NAME,
                                    fields: [],
                                    field: {}
                                }
                            };
                        };
                    };
                    cx.query(sql, function (e, r) {
                        for (var i = 0; i < r.length; i++) {
                            if (scheme.tables.indexOf(r[i].TABLE_NAME) == -1) {
                                //console.log('No index found for table ' + r[i].TABLE_NAME);
                            } else {
                                scheme.table[r[i].TABLE_NAME].fields.push(r[i].COLUMN_NAME);
                                if (!scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME]) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME] = {};
                                if (r[i].IS_NULLABLE == "NO") scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].required = true;
                                else scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].required = false;
                                var linker = -1;
                                for (var k = 0; k < scheme.tables.length; k++) {
                                    if (scheme.table[scheme.tables[k]].index == r[i].COLUMN_NAME) {
                                        if ((scheme.tables[k] != r[i].TABLE_NAME) && (r[i].COLUMN_NAME != scheme.table[scheme.tables[k]].index)) linker = scheme.tables[k] + '.' + scheme.table[scheme.tables[k]].index;
                                    };
                                };
                                if (linker == -1) {
                                    if (r[i].EXTRA == "auto_increment") {
                                        scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "counter";
                                    } else {
                                        var dbtype = r[i].COLUMN_TYPE;
                                        //scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].dbtype = dbtype;
                                        if (dbtype.indexOf('decimal') > -1) {
                                            var ffloat = dbtype.split('decimal(')[1].substr(0, dbtype.split('decimal(')[1].lastIndexOf(')'));
                                            scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "float(" + ffloat + ")";
                                        };
                                        if (dbtype.indexOf('enum') > -1) {
                                            var list = dbtype.split('enum(')[1].substr(0, dbtype.split('enum(')[1].lastIndexOf(')'));
                                            list = eval('[' + list + ']');
                                            scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "list";
                                            scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].list = list;
                                        };
                                        if (dbtype.indexOf('set') > -1) {
                                            var list = dbtype.split('set(')[1].substr(0, dbtype.split('set(')[1].lastIndexOf(')'));
                                            list = eval('[' + list + ']');
                                            scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "list";
                                            scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].list = list;
                                        };
                                        if (dbtype.indexOf('year') > -1) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "year";
                                        if (dbtype.indexOf('varchar') > -1) {
                                            scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "string";
                                            //scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].size = dbtype.split('varchar(')[1].substr(0, dbtype.split('varchar(')[1].lastIndexOf(')'));
                                        };
                                        if ((dbtype.indexOf('char') > -1) && (dbtype.indexOf('varchar') == -1)) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = dbtype;
                                        if (dbtype.indexOf('int') > -1) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "int";
                                        if (dbtype.indexOf('tinyint') > -1) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "int";
                                        if (dbtype == 'tinyint(1)') scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "bool";
                                        if (dbtype.indexOf('timestamp') > -1) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "timestamp";
                                        if (dbtype.indexOf('geometry') > -1) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "geo";
                                        if (dbtype.indexOf('text') > -1) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "text";
                                        if (dbtype.indexOf('blob') > -1) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "blob";
                                        if (dbtype.indexOf('datetime') > -1) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "datetime";
                                        if (dbtype == 'date') scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "date";
                                        if (dbtype == 'time') scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type = "time";
                                        if (r[i].COLUMN_DEFAULT) {
                                            if (r[i].COLUMN_DEFAULT == "CURRENT_TIMESTAMP") r[i].COLUMN_DEFAULT = "NOW";
                                            scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].default = r[i].COLUMN_DEFAULT;
                                            if (scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].type == "bool") {
                                                if (r[i].COLUMN_DEFAULT == 1) scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].default = true;
                                                else scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].default = false;
                                            }
                                        };
                                    };
                                } else {
                                    scheme.table[r[i].TABLE_NAME].field[r[i].COLUMN_NAME].link = linker;
                                }
                            };

                        };
                        var new_scheme = {
                            db: database,
                            tables: [],
                            table: {}
                        };
                        cx.end(function () {
                            fs.mkdir(global.PROJECT_HOME + sep + 'db', function (e) {

                            });
                            fs.writeFile(global.PROJECT_HOME + sep + 'db' + sep + db[ndx].name + '.scheme.json', JSON.stringify(scheme, null, 4), function (e) {
                                dump_scheme(db, ndx + 1, cb);
                            });
                        });
                    });
                });

            };
            fs.readFile(global.PROJECT_HOME + sep + 'etc' + sep + 'settings.json', function (e, r) {
                var settings = JSON.parse(r.toString('utf-8'));
                var db = settings.db;
                if (db.length > 0) console.log('\n- Dumping database scheme');
                dump_scheme(db, 0, cbo);
            });
        };

        function api(api, obj, cb) {
            var request = require('request');
            var Request = {};
            if (global.CFG.current.proxy) var Request = request.defaults({
                'proxy': global.CFG.current.proxy
            });
            else Request = request;
            Request({
                url: manager + 'api/' + api,
                form: obj,
                headers: {
                    'payload': global.CFG.PID
                },
                method: "post",
                encoding: null
            }, function (err, resp, body) {
                if (err) return util.error('Service unavailable');
                try {
                    var response = JSON.parse(body.toString());
                    //console.log(response);
                    cb(response);
                } catch (e) {
                    util.error('Service unavailable');
                }
            });
        };

        fs.stat(root + sep + '.login', function (e) {
            if (e) util.error('You are not logged in!');
            else {
                var PROVIDER = "";
                var USER = "";

                function set_namespace(m) {
                    fs.readFile(dir + '/' + manifest.icon.file, function (e, r) {
                        manifest.b64 = new Buffer(r).toString('base64');
                        var group = m.split(':')[1];
                        if (!group) group = "";

                        var is_proxy = 0;
                        if (global.CFG.current.proxy) is_proxy = 1;
                        manifest.git = m + '/' + manifest.namespace + '.git';
                        api('repo/create', {
                            provider: PROVIDER,
                            user: USER,
                            group: m.split(':')[1],
                            manifest: JSON.stringify(manifest),
                            repository: m + '/' + manifest.namespace + '.git',
                            proxy: is_proxy,
                            config: JSON.stringify('{}')
                        }, function (response) {

                            if (response.error) {
                                var msg = chalk.red("\n[ ERR ]");
                                msg += "\tThis project namespace has already been taken\n";
                            };

                            if (response.token) REPO_TOKEN = response.token;
                            manifest.git = m + '/' + manifest.namespace + '.git';
                            delete manifest.b64;

                            fs.writeFile(global.PROJECT_HOME + sep + 'app.manifest', JSON.stringify(manifest, null, 4), function (e) {
                                nodegit.Repository.open(path.resolve(dir, ".git")).then(function (repo) {
                                    repository = repo;
                                    return repository.index();
                                }).then(function () {
                                    return repository.refreshIndex();
                                }).then(function (idx) {
                                    index = idx;
                                }).then(function () {
                                    return index.addAll()
                                }).then(function () {
                                    return index.write();
                                }).then(function () {
                                    return index.writeTree();
                                }).then(function (oidResult) {
                                    oid = oidResult;
                                    return nodegit.Reference.nameToId(repository, "HEAD");
                                }).then(function (head) {
                                    return repository.getCommit(head);
                                }).then(function (parent) {
                                    var mail = global.CFG.mail;
                                    var username = global.CFG.username;
                                    if (!username) var username = "Unkown user";
                                    if (!mail) var mail = "unkown@myawesomecompany.com";
                                    var author = nodegit.Signature.now(username,
                                        mail);
                                    var committer = nodegit.Signature.now(username,
                                        mail);
                                    return repository.createCommit("HEAD", author, committer,
                                        title, oid, [parent]).then(function () {
                                        var caption = '\tSnapshot #' + build + ' (' + manifest.version + '.' + build + ')';
                                        if (title.indexOf('build') == -1) caption += " - " + title;
                                        console.log('[ OK ]'.green + caption);
                                    }).catch(function (err) {
                                        console.log(err);
                                    });
                                }).then(function () {

                                    var host = manifest.git.split('@')[1].split(':')[0];
                                    var url = manifest.git.split(':')[1];
                                    manifest.git = "https://oauth2:" + REPO_TOKEN + "@" + host + "/" + url;


                                    nodegit.Remote.create(repository, "origin",
                                        manifest.git).then(function (remoteResult) {
                                        remote = remoteResult;
                                        console.log('[ .. ]\t'.yellow + ('Pushing to repository... Please wait...'));
                                        var proxyOpts = {};
                                        if (global.CFG.current.proxy) var proxyOpts = {
                                            url: global.CFG.current.proxy,
                                            type: 2,
                                            version: 1
                                        };
                                        return remote.push(
                                            ["refs/heads/master:refs/heads/master"], {
                                                certificateCheck: function () {
                                                    return 1;
                                                },
                                                proxyOpts: proxyOpts,
                                                callbacks: {
                                                    credentials: function (url, userName) {
                                                        /*if (global.CFG.current.proxy) return nodegit.Cred.userpassPlaintextNew("oauth2", REPO_TOKEN);
                                                        else return nodegit.Cred.sshKeyNew(
                                                            userName,
                                                            root + sep + ".ssh.public",
                                                            root + sep + ".ssh.private",
                                                            "");*/
                                                        return nodegit.Cred.userpassPlaintextNew("oauth2", REPO_TOKEN);
                                                    }
                                                }
                                            }
                                        );
                                    }).catch(function (reason) {
                                        RXPUSH = reason;

                                        nodegit.Remote.delete(repository, "origin").then(function (res) {
                                            nodegit.Remote.create(repository, "origin",
                                                manifest.git).then(function (remoteResult) {
                                                remote = remoteResult;
                                                var proxyOpts = {};
                                                if (global.CFG.current.proxy) var proxyOpts = {
                                                    url: global.CFG.current.proxy,
                                                    type: 2,
                                                    version: 1
                                                };
                                                console.log('[ .. ]\t'.yellow + ('Pushing to repository... Please wait...'));
                                                return remote.push(
                                                    ["refs/heads/master:refs/heads/master"], {
                                                        proxyOpts: proxyOpts,
                                                        certificateCheck: function () {
                                                            return 1;
                                                        },
                                                        callbacks: {
                                                            credentials: function (url, userName) {
                                                                /*if (global.CFG.current.proxy) return nodegit.Cred.userpassPlaintextNew("oauth2", REPO_TOKEN);
                                                                else return nodegit.Cred.sshKeyNew(
                                                                    userName,
                                                                    root + sep + ".ssh.public",
                                                                    root + sep + ".ssh.private",
                                                                    "");*/
                                                                return nodegit.Cred.userpassPlaintextNew("oauth2", REPO_TOKEN);
                                                            }
                                                        }
                                                    }
                                                );
                                            }).done(function () {
                                                console.log('[ OK ]\t'.green + chalk.bold('your project is linked!\n'));
                                            });;
                                        });
                                    }).done(function () {
                                        if (RXPUSH != -1) return;
                                        //console.log('[ OK ]'.green + '\tPushed.');

                                        //console.log(emojic.ok + caption.cyan);
                                        console.log('');
                                    });

                                });
                            })
                        });
                    })
                };

                function get_group(i) {
                    var obj = {};
                    if (i) obj.provider = i;
                    api('repo/groups', obj, function (response) {
                        USER = response.items[0];
                        if (response.items.length == 0) return util.error("Bad request");
                        if (response.items.length == 1) return set_namespace(response.name + response.items[0]);
                        inquirer.prompt([{
                            type: 'list',
                            name: "group",
                            message: "Choose your group to link your project",
                            choices: response.items
                        }]).then(answers => {
                            PROVIDER = response.name;
                            console.log("\n  " + chalk.bold("Creating project " + chalk.cyan.bold(PROVIDER + '/' + manifest.namespace)));
                            set_namespace('git@' + response.name + '.com:' + answers.group);
                        });
                    });
                };
                prepare_db(function (response) {
                    api('islink', {
                        manifest: JSON.stringify(manifest)
                    }, function (response) {
                        if (response.err) {
                            util.error("This project has already been linked.");
                        } else {

                            api('repo/list', {}, function (response) {
                                console.log("- Contacting repository...");
                                var choices = [];
                                var NO_REPO = '\n\t' + emojic.warning + '   You have not configured any repository yet for your account.\n\tPlease visit ' + Console.green + '\n';
                                for (var i = 0; i < response.length; i++) choices.push(response[i].repo_name);
                                if (response.length == 0) return console.log(NO_REPO.yellow);
                                if (response.length == 1) return get_group();
                                inquirer.prompt([{
                                    type: 'list',
                                    name: "provider",
                                    message: "Choose your source code management provider",
                                    choices: choices
                                }]).then(answers => {
                                    console.log("  " + chalk.bold("Connecting to " + chalk.cyan.bold(answers.provider)));
                                    get_group(answers.provider);
                                });
                            });
                        };
                    });
                });

            }
        })
    });


}();