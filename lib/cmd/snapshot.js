module.exports = function () {

    var fs = require('fs');
    var path = require('path');
    var sep = "/";
    var emojic = require("emojic");
    var shelljs = require('shelljs');
    var util = require('../util');
    var nodegit = require('nodegit');
    require('../globals');
    var root = require('os').homedir() + sep + 'omneedia';
    var dir = global.PROJECT_HOME;
    var title = -1;
    for (var i = 0; i < process.args['_'].length; i++) {
        if (process.args['_'][i] == "snapshot") {
            if (process.args['_'][i + 1]) title = process.args['_'][i + 1];
        }
    }
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
                                console.log('done');
                            });
                        });
                        return logs;
                    }).done();
                    return;
                };
            } else title = args[0];
        };

        var build = manifest.build;
        build++;
        manifest.build = build;
        if (title == -1) title = "build #" + build;

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
                    var caption = '\tSnapshot build#' + build + ' (' + manifest.version + '.' + build + ')';
                    if (title.indexOf('build') == -1) caption += " - " + title;
                    console.log('[ OK ]'.green + caption);
                    console.log('');
                }).catch(function (err) {
                    console.log(err);
                });
            }).then(function () {
                if (args.indexOf("push") > -1) {
                    nodegit.Remote.create(repository, "origin",
                        manifest.git).then(function (remoteResult) {
                        remote = remoteResult;
                        console.log('\tPushing to repository... Please wait...');
                        return remote.push(
                            ["refs/heads/master:refs/heads/master"], {
                                certificateCheck: function () {
                                    return 1;
                                },
                                callbacks: {
                                    credentials: function (url, userName) {

                                        return nodegit.Cred.sshKeyNew(
                                            userName,
                                            root + sep + ".ssh.public",
                                            root + sep + ".ssh.private",
                                            "");

                                    }
                                }
                            }
                        );
                    }).catch(function (reason) {
                        console.log(reason);
                    }).done(function () {
                        console.log('[ OK ]'.green + '\tPushed.');
                        //console.log(emojic.ok + caption.cyan);
                        console.log('');
                    });
                }
            });
        });


    });
}();