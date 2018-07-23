module.exports = function () {

    var emojic = require('emojic');
    const chalk = require('chalk');
    var path = require('path');
    var sep = "/";
    var path = require('path');
    var os = require('os');
    var fs = require('fs');
    var crypto = require('crypto');
    var nodegit = require('nodegit');
    var util = require('../util');
    var root = os.homedir() + sep + 'omneedia';
    var inquirer = require('inquirer');
    const terminalLink = require('terminal-link');
    var REPO_TOKEN = -1;
    var p = process.argv.indexOf('build');
    var CMD = process.argv[p + 1];



    require('../globals');
    var root = require('os').homedir() + sep + 'omneedia';

    var dir = global.PROJECT_HOME;

    if (!fs.existsSync(root)) fs.mkdirSync(root);
    var Console = global.CFG.console;
    var manager = global.CFG.manager;

    const LINK = terminalLink('omneedia console', Console);

    console.log(chalk.bold("Build project."));
    console.log('Build your project with omneedia CI.')
    console.log('____________________\n')

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
                cb(response);
            } catch (e) {
                util.error('Service unavailable');
            }
        });
    };

    fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function (e, r) {
        if (e) util.error("Can't find app.manifest ... Must be run inside your project root.");
        var manifest = JSON.parse(r.toString('utf-8'));

        fs.stat(root + sep + '.login', function (e) {
            if (e) util.error('You are not logged in!');
            else {
                var PROVIDER = "";
                var USER = "";
                if (CMD) {
                    if (CMD == "cancel") {
                        api('build/cancel', {
                            id: manifest.uid
                        }, function (response) {
                            console.log('[ OK ]'.green + '\tBuild job canceled\n');

                        });
                        return;
                    };
                };
                console.log('- Connecting to nodes manager...');
                api('build', {
                    id: manifest.uid
                }, function (response) {

                    if (response.node == -1) {
                        var info = "[ INFO ] ".green +
                            " No more node available. Please try again later.\n".black;
                        socket.disconnect();
                        return console.log("\t" + info);
                    };

                    if (response.ERR == "NO_MORE_NODE") {
                        var info = "[ UPGRADE ] ".red +
                            "  Limit plan exceeded. No more node available for build tasks.\n".black + "\t\t      Please upgrade your plan or switch off one or more build task(s).\n".black + "\t\t      Please visit " + LINK.yellow + "\n".black;
                        return console.log("\n\t" + info);
                    };

                    if (response.token) {
                        REPO_TOKEN = response.token;
                        var version = manifest.version.split('.');
                        var build = manifest.build++;
                        version[2]++;
                        version = version.join('.');
                        inquirer.prompt([{
                            type: 'input',
                            name: 'version',
                            default: version,
                            message: "Build version"
                        }]).then(answers => {
                            var v = answers.version.split('.');
                            if (v.length != 3) return util.error('invalid version build number. Expected x.x.x');
                            for (var i = 0; i < v.length; i++) {
                                if (!Number.isInteger(v[i] * 1)) return util.error('invalid version build number. Expected x.x.x');
                            };
                            manifest.version = version;
                            manifest.build = build;
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
                                    var author = nodegit.Signature.now(username, mail);
                                    var committer = nodegit.Signature.now(username, mail);
                                    var title = "CI build #" + manifest.version + " (" + manifest.build + ")";
                                    return repository.createCommit("HEAD", author, committer,
                                        title, oid, [parent]).then(function () {
                                        var caption = '\tProduction build#' + build + ' (' + manifest.version + '.' + build + ')';
                                        if (title.indexOf('build') == -1) caption += " - " + title;
                                        console.log('\n[ OK ]'.green + caption);
                                        console.log('');
                                    }).catch(function (err) {
                                        console.log(err);
                                    });
                                }).then(function () {
                                    // if (global.CFG.current.proxy)
                                    {
                                        var host = manifest.git.split('@')[1].split(':')[0];
                                        var url = manifest.git.split(':')[1];
                                        manifest.git = "https://oauth2:" + REPO_TOKEN + "@" + host + "/" + url;
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
                                                console.log('[ OK ]'.green + '\tPushed.');
                                                //console.log(emojic.ok + caption.cyan);
                                                console.log('');
                                                api('build/id', {
                                                    ns: manifest.uid
                                                }, function (r) {
                                                    //console.log(r);
                                                    if (r.status == "OK") {
                                                        console.log('[ OK ]'.green + '\tBuild job #' + chalk.bold(r.id) + "\n");
                                                    } else {
                                                        console.log('[ FAILED ]'.red + '\tBuild job failed.\n');
                                                    }
                                                })
                                            });
                                        });
                                    }).done(function () {
                                        if (RXPUSH != -1) return;
                                        console.log('[ OK ]'.green + '\tPushed.');
                                        //console.log(emojic.ok + caption.cyan);
                                        console.log('');
                                        api('build/id', {
                                            ns: manifest.uid
                                        }, function (r) {
                                            //console.log(r);
                                            if (r.status == "OK") {
                                                console.log('[ OK ]'.green + '\tBuild job #' + chalk.bold(r.id) + "\n");
                                            } else {
                                                console.log('[ FAILED ]'.red + '\tBuild job failed.\n');
                                            }
                                        })
                                    });

                                });

                            });

                        });
                    }

                })

            }
        })
    });


}();