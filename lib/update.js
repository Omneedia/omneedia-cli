module.exports = function() {
    var util = require('./util');
    var fs = require('fs');
    var path = require('path');
    var sep = "/";
    var emojic = require("emojic");
    var inquirer = require('inquirer');
    var nodegit = require('nodegit');

    function read_manifest(cb) {
        fs.readFile(global.PROJECT_HOME + sep + 'app.manifest', function(e, r) {
            if (e) util.error("Can't find manifest");
            var lic = [];
            fs.readdir(__dirname + sep + '..' + sep + 'license', function(e, list) {
                for (var i = 0; i < list.length; i++) {
                    lic.push(list[i].split('.')[0].toUpperCase());
                };
                try {
                    var Manifest = JSON.parse(r.toString('utf-8'));
                } catch (e) {
                    util.error('Manifest not readable');
                };
                var questions = [{
                    type: 'input',
                    name: 'title',
                    default: 'my new project',
                    message: '\tTitle of your project'
                }, {
                    type: 'input',
                    name: 'description',
                    default: 'package description goes here',
                    message: '\tDescription'
                }, {
                    type: 'list',
                    name: 'lic',
                    default: 'BSD3',
                    message: '\tLicense',
                    choices: lic
                }, {
                    type: 'input',
                    name: 'company',
                    default: 'MyAwesomeCompany',
                    message: '\tCompany'
                }];
                inquirer.prompt(questions).then(function(answers) {
                    Manifest.namespace = global.PROJECT_NAME;
                    Manifest.title = answers.title;
                    Manifest.description = answers.description;
                    Manifest.copyright = "Copyright (c) " + (new Date()).getFullYear() + " " + answers.company;
                    Manifest.license = answers.lic;
                    Manifest.uid = require('shortid').generate();
                    fs.writeFile(global.PROJECT_HOME + sep + "app.manifest", JSON.stringify(Manifest, null, 4), function(e) {
                        var readme = [];
                        readme.push('# ' + Manifest.title);
                        readme.push(Manifest.description);
                        readme.push('## ' + Manifest.namespace);
                        readme.push(Manifest.copyright);
                        readme.push('## History');
                        readme.push('First commit');
                        readme.push('## Credits');
                        readme.push("Author: [" + Manifest.author.name + "](mailto:" + Manifest.author.mail + ")");
                        var readme_file = __dirname + sep + ".." + sep + "license" + sep + Manifest.license.toLowerCase() + ".txt";
                        fs.readFile(readme_file, function(e, r) {
                            if (r) {
                                readme.push('## License');
                                readme_file = r.toString('utf-8');
                                readme_file = readme_file.replace('{{ year }}', (new Date()).getFullYear());
                                readme_file = readme_file.replace('{{ organization }}', answers.company);
                                readme_file = readme_file.replace('{{ project }}', Manifest.title);
                                readme.push(readme_file);
                            };
                            fs.writeFile(global.PROJECT_HOME + sep + "README.md", readme.join('\n'), function() {
                                console.log('');
                                var dir = global.PROJECT_HOME;
                                nodegit.Repository.init(dir, 0).then(function(repo) {
                                    nodegit.Repository.open(path.resolve(dir, ".git")).then(function(repo) {
                                        repository = repo;
                                        return repository.index();
                                    }).then(function() {
                                        return repository.refreshIndex();
                                    }).then(function(idx) {
                                        index = idx;
                                    }).then(function() {
                                        return index.addAll()
                                    }).then(function() {
                                        return index.write();
                                    }).then(function() {
                                        return index.writeTree();
                                    }).then(function(oid) {
                                        var mail = global.CFG.mail;
                                        var username = global.CFG.username;
                                        if (!username) var username = "Unkown user";
                                        if (!mail) var mail = "unkown@myawesomecompany.com";
                                        var author = nodegit.Signature.now(username,
                                            mail);
                                        var committer = nodegit.Signature.now(username,
                                            mail);
                                        return repository.createCommit("HEAD", author, committer,
                                            "initial commit", oid, []).then(function() {
                                            console.log(emojic.ok + '  Project successfully created.'.cyan);
                                            console.log('');
                                        }).catch(function(err) {
                                            console.log(err);
                                        });

                                    });
                                });

                            });
                        });
                    });
                });

            });
        });
    };
    var dirs = [
        global.PROJECT_BIN,
        global.PROJECT_DEV,
        global.PROJECT_WEB,
        global.PROJECT_API,
        global.PROJECT_DEV,
        global.PROJECT_SYSTEM,
        global.PROJECT_ETC,
        global.PROJECT_TMP
    ];
    util.makedirs(dirs, read_manifest);
}();