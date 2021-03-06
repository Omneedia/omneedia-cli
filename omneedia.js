#!/usr/bin/env node

/*
 * Omneedia
 * One framework to code'em all!
 * Copyright (c) 2017 OmneediaFramework
 */


var path = require('path');
var sep = "/";

var parseArgs = require('minimist');
process.args = parseArgs(process.argv);

var cli = require('./lib/cli');

//if (process.args.mysql) require('./lib/cmd/mysql');
Math = require('./lib/framework/math')();
Date = require('./lib/framework/dates')();
Object = require('./lib/framework/objects')();
Array = require('./lib/framework/arrays')();
require('./lib/framework/utils');

function cmds() {

    // cloud
    if (process.argv.indexOf('db') > -1) return require('./lib/cmd/db')();

    if (process.argv.indexOf('create') > -1) require('./lib/cmd/create');
    if (process.argv.indexOf('config') > -1) require('./lib/cmd/config');
    if (process.argv.indexOf('start') > -1) require('./lib/cmd/start');
    if (process.argv.indexOf('update') > -1) require('./lib/cmd/update');
    if (process.argv.indexOf('login') > -1) require('./lib/cmd/login');
    if (process.argv.indexOf('logout') > -1) require('./lib/cmd/logout');

    if (process.argv.indexOf('generate') > -1) return require('./lib/cmd/generate');
    if (process.argv.indexOf('g') > -1) return require('./lib/cmd/generate');

    if (process.argv.indexOf('link') > -1) return require('./lib/cmd/link');
    if (process.argv.indexOf('unlink') > -1) return require('./lib/cmd/unlink');
    if (process.argv.indexOf('up') > -1) return require('./lib/cmd/up');
    if (process.argv.indexOf('down') > -1) return require('./lib/cmd/down');

    if (process.argv.indexOf('build') > -1) return require('./lib/cmd/build');

    if (process.argv.indexOf('key') > -1) return require('./lib/cmd/key');

    if (process.argv.indexOf('snapshot') > -1) require('./lib/cmd/snapshot');
    if (process.argv.indexOf('history') > -1) require('./lib/cmd/history');

    // EXPERIMENTAL !!
    if (process.argv.indexOf('ionic') > -1) {
        const cp = require('child_process');
        var z = -1;
        for (var i = 0; i < process.argv.length; i++) {
            if (process.argv[i].indexOf('omneedia.js') > -1) z = i;
        };
        if (z == -1) return console.log('die.');
        var _root = process.argv[z].split('omneedia.js')[0];
        process.argv.splice(0, process.argv.indexOf('ionic') + 1);
        const n = cp.fork(_root + sep + 'ionic-app-scripts' + sep + 'bin' + sep + 'ionic-app-scripts.js', process.argv);
        n.on('message', (m) => {
            console.log('PARENT got message:', m);
        });
        process.on('message', (m) => {
            console.log('CHILD got message:', m);
        });
    }
};

// Init the display
cli.config(function () {

    if (process.argv.indexOf('start') > -1) {
        require('./lib/globals');
        // Monitor
        var uniqueid = require('uuid');
        global._SESSION_ = uniqueid.v4();

        if (process.argv.indexOf('auto#0') > -1) _FIRST_TIME = 1;
        else _FIRST_TIME = 0;

        function __RESTART__(op) {
            var _CP = require('child_process');
            var aargs = process.argv.slice(2);
            var rr = aargs.indexOf('--watch');
            if (rr > -1) {
                aargs.splice(rr, 1);
                aargs.unshift('session#' + global._SESSION_);
                aargs.unshift('auto#' + op);
            };
            var _CP2 = _CP.fork(__dirname + require('path').sep + "omneedia.js", aargs);
            _CP2.on('exit', function () {
                __RESTART__(1);
            });
        };

        if (process.argv.indexOf("--watch") > -1) {
            __RESTART__(0);
            return;
        };


        if ((process.argv.indexOf("auto#1") > -1) || (process.argv.indexOf("auto#0") > -1)) {

            var monitor = require('chokidar');

            var watcher = monitor.watch([PROJECT_APP, PROJECT_SYSTEM, PROJECT_API], {
                persistent: true
            });

            watcher.on('raw', function (path, stats, details) {

                if (stats.indexOf('package.json') > -1) return;
                if (stats.indexOf('node_modules') > -1) return;
                //if (stats.indexOf('favicon.ico')>-1) return;
                if ((stats.indexOf('.ts') == -1) && (stats.indexOf('.scss') == -1) && (stats.indexOf('.css') == -1) && (stats.indexOf('.htm') == -1) && (stats.indexOf('.js') == -1) && (stats.indexOf('.json') == -1)) return;
                if (stats.indexOf('package-lock.json') > -1) return;
                if (stats.indexOf('/theme/') > -1) return;
                if (stats.indexOf('/etc/') > -1) return;
                //if (stats.indexOf('/Settings.js') > -1) return;
                if (stats.indexOf('.DS_Store') > -1) return;


                var chalk = require('chalk');

                console.log(chalk.bold.yellow("\t\nChange detected... reload".yellow));
                console.log("");
                console.log(stats);
                if (details) console.log(JSON.stringify(details, null, 4).yellow);
                console.log("");
                process.kill(process.pid);
            });
        };
    }

    cli.display(cmds);

});