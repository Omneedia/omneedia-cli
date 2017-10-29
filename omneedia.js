#!/usr/bin/env node

/*
 * Omneedia
 * One framework to code'em all!
 * Copyright (c) 2017 OmneediaFramework
 */

global.$_VERSION = "0.9.X";

var path = require('path');
var sep="/";

var parseArgs = require('minimist');
process.args = parseArgs(process.argv);

var cli=require('./lib/cli');

function cmds() {
	if (process.args.mysql) require('./lib/cmd/mysql');
	if (process.argv.indexOf('create')>-1) require('./lib/cmd/create');
	if (process.argv.indexOf('config')>-1) require('./lib/cmd/config');
	if (process.argv.indexOf('start')>-1) require('./lib/cmd/start');
	if (process.argv.indexOf('update')>-1) require('./lib/cmd/update');
	
	if (process.argv.indexOf('ionic')>-1) {
		const cp = require('child_process');
		var z=-1;
		for (var i=0;i<process.argv.length;i++) {
			if (process.argv[i].indexOf('omneedia.js')>-1) z=i;
		};
		if (z==-1) return console.log('die.');
		var _root=process.argv[z].split('omneedia.js')[0];
		process.argv.splice(0,process.argv.indexOf('ionic')+1);
		const n = cp.fork(_root+sep+'ionic-app-scripts'+sep+'bin'+sep+'ionic-app-scripts.js',process.argv);
		n.on('message', (m) => {
  			console.log('PARENT got message:', m);
		});
		process.on('message', (m) => {
  			console.log('CHILD got message:', m);
		});
	}
};

// Init the display
cli.config(function() {
	
	if (process.argv.indexOf('start')>-1) {
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
			var watcher = monitor.watch([PROJECT_APP,PROJECT_HOME],{persistent: true});
			watcher.on('raw', function(path, stats,details) {
				if (stats.indexOf('package.json')>-1) return;
				if (stats.indexOf('node_modules')>-1) return;
				//if (stats.indexOf('favicon.ico')>-1) return;
				if ((stats.indexOf('.ts')==-1) && (stats.indexOf('.scss')==-1) && (stats.indexOf('.css')==-1) && (stats.indexOf('.htm')==-1) && (stats.indexOf('.js')==-1) && (stats.indexOf('.json')==-1)) return;
				if (stats.indexOf('package-lock.json')>-1) return;
				if (stats.indexOf('/theme/')>-1) return;
				if (stats.indexOf('/etc/')>-1) return;
				if (stats.indexOf('Settings.js')>-1) return;
				if (stats.indexOf('.DS_Store')>-1) return;
				var emojic = require("emojic");
				console.log("");
				console.log(emojic.warning+"     Change detected... reload".yellow);
				console.log("");
				if (details) console.log(JSON.stringify(details,null,4).yellow);
				console.log("");
				process.kill(process.pid);
			});
		};		
	}
	
	cli.display(cmds);
});