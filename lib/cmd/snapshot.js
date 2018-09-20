module.exports = function () {

    var fs = require('fs');
    var path = require('path');
    var sep = "/";
    var emojic = require("emojic");
    var shelljs = require('shelljs');
    var util = require('../util');
    var nodegit = require('nodegit');
    var REPO_TOKEN = -1;
    var manager = global.CFG.manager;
    require('../globals');
    var root = require('os').homedir() + sep + 'omneedia';
    var dir = global.PROJECT_HOME;
    var title = -1;
    for (var i = 0; i < process.args['_'].length; i++) {
        if (process.args['_'][i] == "snapshot") {
            if (process.args['_'][i + 1]) {
                if (process.args['_'][i + 1] != "push") title = process.args['_'][i + 1];
            }
        }
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
    fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {
        if (e) util.error("Can't find app.manifest ... Must be run inside your project root.");
        var manifest = JSON.parse(r.toString('utf-8'));
        var args = process.args._;
        args.shift();
        args.shift();
        args.shift();
        if (args.length > 0) {
            var cmd = [
                "list", "remote"
            ];

            if (cmd.indexOf(args[0]) > -1) {
                if (args[0] == "list") {

                    var counter = 0;
                    nodegit.Repository.open(path.resolve(dir, ".git")).then(function (repo) {
                        repository = repo;
                        return repo.getMasterCommit();
                    }).then(function (firstCommitOnMaster) {
                        // History returns an event.
                        var logs = [];
                        var ndx = [];
                        var list = [];
                        var history = firstCommitOnMaster.history(nodegit.Revwalk.SORT.TIME);
                        history.on("commit", function (commit) {
                            logs.push({
                                index: counter,
                                message: commit.message(),
                                date: commit.date(),
                                author: commit.author().name(),
                                author_mail: commit.author().email(),
                                id: commit.sha()
                            });
                            if (counter == 0) var cc = "NOW";
                            else var cc = counter;
                            list.push(cc + ': ' + commit.message() + ' (' + commit.date().toString('dd/MM/yyyy - hh:mm:ss') + ')');
                            counter++;
                        });
                        history.start();
                        history.on('end', function () {
                            var inquirer = require('inquirer');
                            inquirer.prompt([{
                                type: 'list',
                                name: 'letter',
                                message: "Code history",
                                paginated: true,
                                choices: list
                            }]).then(answers => {
                                console.log(answers);
                                console.log('done');
                            });
                        });
                        return logs;
                    }).done();
                    return;
                };
            } else {
                title = args[0];
                if (args[0] == "push") title = -1;
            }
        };

        var build = manifest.build;
        var RXPUSH = -1;
        build++;
        manifest.build = build;
        if (title == -1) title = "snapshot #" + build;

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
                    console.log('');
                }).catch(function (err) {
                    console.log(err);
                });
            }).then(function () {
                if (args.indexOf("push") == -1) return;

                function callback(response) {
                    if (!response.token) {
                        util.error('ERROR: There was an error communicating with the server (' + JSON.stringify(response) + ')')
                    };
                    REPO_TOKEN = response.token;

                    var host = manifest.git.split('@')[1].split(':')[0];
                    var url = manifest.git.split(':')[1];
                    manifest.git = "https://oauth2:" + REPO_TOKEN + "@" + host + "/" + url;

                    if (global.CFG.current.proxy) var proxyOpts = {
                        url: global.CFG.current.proxy,
                        type: 2,
                        version: 1
                    };

                    nodegit.Remote.create(repository, "origin",
                        manifest.git).then(function (remoteResult) {
                        remote = remoteResult;
                        console.log('\tPushing to repository... Please wait...');
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

                                        /*return nodegit.Cred.sshKeyNew(
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
                                console.log('\tPushing to repository... Please wait...');
                                return remote.push(
                                    ["refs/heads/master:refs/heads/master"], {
                                        certificateCheck: function () {
                                            return 1;
                                        },
                                        proxyOpts: proxyOpts,
                                        callbacks: {
                                            credentials: function (url, userName) {
                                                /*
                                                return nodegit.Cred.sshKeyNew(
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
                                console.log('[ OK ]'.green + '\tPushed.');
                                //console.log(emojic.ok + caption.cyan);
                                console.log('');
                            });
                        });
                    }).done(function () {
                        if (RXPUSH != -1) return;
                        console.log('[ OK ]'.green + '\tPushed.');
                        //console.log(emojic.ok + caption.cyan);
                        console.log('');
                    });

                };
                var step = "";


            });
        });


    });
}();