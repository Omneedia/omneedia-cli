module.exports = function() {

    var fs = require('fs');
    var path = require('path');
    var sep = "/";
    var emojic = require("emojic");
    var shelljs = require('shelljs');
    var util = require('../util');
    var nodegit = require('nodegit');
    require('../globals');
    var dir = global.PROJECT_HOME;
    nodegit.Repository.open(path.resolve(dir, ".git")).then(function(repo) {
        return repo.getMasterCommit();
    }).then(function(firstCommitOnMaster) {
        // Create a new history event emitter.
        var history = firstCommitOnMaster.history();
        history.on("commit", function(commit) {
            console.log(commit.sha());
        });
        history.start();
    });

}();