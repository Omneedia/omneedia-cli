module.exports = function() {
	
	var fs = require('fs');
	var path = require('path');
	var sep = "/";
	var emojic = require("emojic");
	var shelljs = require('shelljs');
	var util = require('../util');
	var server = require('../server/start');
	var setmeup = require('../settings');
	
	global.Clients = {
		uid: {}
		, mail: {}
	};
	
	require('../globals');
	
	function update_resources(manifest,cb) {
		var IM = require('imagemagick');
		//var IM = require("jimp");
		function convert(GP,i,cb) {
			if (!GP[i]) return cb();
			/*IM.read(GP[i].in, function (err, img) {
				img.write(GP[i].out);
			});*/
			var args=GP[i].cmd.split(' ');
			for (var z=0;z<args.length;z++) cmd.push(args[z]);
			cmd.push(GP[i].out);
			IM.convert(cmd, function() {
				convert(GP,i+1,cb);	
			});
		};
		function logoApp(cb) {
			var GRAPHICS = [];
			/*if (manifest.platform == "webapp") {
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.icon.file,
					out: global.PROJECT_RES + sep + 'favicon.ico',
					cmd: '-bordercolor white -border 0 -resize x16 -gravity center -background transparent -flatten -colors 256'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + 'logo.png',
					cmd: '-resize 256x256' 
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.icon.file,
					out: global.PROJECT_RES + sep + 'webapp' + sep + 'ico.png',
					cmd: '-resize x16' 
				});			
			};*/
			if (manifest.platform == "mobile") {
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.icon.file,
					out: global.PROJECT_RES + sep + 'favicon.ico',
					cmd: '-bordercolor white -border 0 -resize x16 -gravity center -background transparent -flatten -colors 256'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + 'logo.png',
					cmd: '-resize 256x256' 
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.icon.file,
					out: global.PROJECT_RES + sep + 'webapp' + sep + 'ico.png',
					cmd: '-resize x16' 
				});					
				/*GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + '640x920.png',
					cmd: '-gravity center -background "'+global.PROJECT_HOME + sep + manifest.splashscreen.background+'" -resize 510 -extent 640x920'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + '640x1096.png',
					cmd: '-gravity center -background "'+global.PROJECT_HOME + sep + manifest.splashscreen.background+'" -resize 510 -extent 640x1096'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + 'default.png',
					cmd: '-gravity center -background "'+global.PROJECT_HOME + sep + manifest.splashscreen.background+'" -resize 320x460 -extent 320x460'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + '768x1004.png',
					cmd: '-gravity center -background "'+global.PROJECT_HOME + sep + manifest.splashscreen.background+'" -resize 510 -extent 768x1004'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + '748x1024.png',
					cmd: '-gravity center -background "'+global.PROJECT_HOME + sep + manifest.splashscreen.background+'" -resize 510 -extent 748x1024'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + '1496x2048.png',
					cmd: '-gravity center -background "'+global.PROJECT_HOME + sep + manifest.splashscreen.background+'" -resize 510 -extent 1496x2048'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + '1536x2008.png',
					cmd: '-gravity center -background "'+global.PROJECT_HOME + sep + manifest.splashscreen.background+'" -resize 510 -extent 1536x2008'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + '2048x1496.png',
					cmd: '-gravity center -background "'+global.PROJECT_HOME + sep + manifest.splashscreen.background+'" -resize 510 -extent 2048x1496'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.splashscreen.file,
					out: global.PROJECT_RES + sep + 'startup' + sep + 'logo.png',
					cmd: '-resize 256x256'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.icon.file,
					out: global.PROJECT_RES + sep + 'icons' + sep + 'icon.png',
					cmd: '-flatten -resize 57x57 -background "'+manifest.icon.background+'"'
				});	
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.icon.file,
					out: global.PROJECT_RES + sep + 'icons' + sep + 'icon@72.png',
					cmd: '-flatten -resize 72x72 -background "'+manifest.icon.background+'"'
				});
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.icon.file,
					out: global.PROJECT_RES + sep + 'icons' + sep + 'icon@114.png',
					cmd: '-flatten -resize 114x114 -background "'+manifest.icon.background+'"'
				});					
				GRAPHICS.push({
					in: global.PROJECT_HOME + sep + manifest.icon.file,
					out: global.PROJECT_RES + sep + 'icons' + sep + 'icon@144.png',
					cmd: '-flatten -resize 144x144 -background "'+manifest.icon.background+'"'
				});*/
			};
			convert(GRAPHICS,0,cb);
		};			
		console.log('\t'+emojic.whiteCheckMark+'  Updating resources');
		fs.mkdir(global.PROJECT_RES + sep + 'startup',function() {
			logoApp(cb);
		})
	};
	
	function update_npm(pkg,cb) {
		process.chdir(global.PROJECT_BIN);
		shelljs.exec('npm install', {
			silent: true
		},function() {
			fs.writeFile(global.PROJECT_BIN + sep + 'package.cache', JSON.stringify(pkg),function() {
				process.chdir(global.PROJECT_HOME);
				cb();
			});
		});
	};	
	
	function update_modules(manifest,cb) {
		// generate package.json
		var pkg = {
			name: manifest.namespace
			, description: manifest.description
			, dependencies: {}
			, license: manifest.license
		};
		for (var j = 0; j < manifest.packages.length; j++) {
			if (manifest.packages[j].indexOf(':')>-1) {
				var name=manifest.packages[j].split(':')[0];
				var version=manifest.packages[j].split(':')[1];
			} else {
				var version='*';
				var name=manifest.packages[j];
			}
			pkg.dependencies[name] = version;
		};
		for (var j = 0; j < manifest.plugins.length; j++) {
			if (manifest.plugins[j].indexOf(':')>-1) {
				var name=manifest.plugins[j].split(':')[0];
				var version=manifest.plugins[j].split(':')[1];
			} else {
				var version='*';
				var name=manifest.plugins[j];
			}
			pkg.dependencies[name] = version;
		};		
		fs.writeFile(global.PROJECT_BIN + sep + 'package.json', JSON.stringify(pkg, null, 4),function() {
			fs.readFile(global.PROJECT_BIN + sep + 'package.cache',function(e,r) {
				if (e) update_npm(pkg,cb); else {
					// compare new package.json to package.cache
					var cache=JSON.parse(r.toString('utf-8'));
					if (JSON.stringify(pkg.dependencies)==JSON.stringify(cache.dependencies)) cb(); else update_npm(pkg,cb);
				}
			});
			
		});
	};
	
	console.log('');
	fs.readFile(global.PROJECT_HOME + sep + 'app.manifest',function(e,r) {
		if (e) util.error("Can't find manifest");
		try {
			var manifest=JSON.parse(r.toString('utf-8'));
		} catch(e) {
			util.error('Manifest not readable');
		};		
		console.log('- Starting '+manifest.namespace);
		console.log('  '+manifest.title.cyan);
		console.log('  '+manifest.description.cyan);
		console.log('  '+manifest.copyright.cyan);
		console.log('  version '+manifest.version.white);
		console.log('');
		console.log('\t'+emojic.whiteCheckMark+'  Updating modules');
		var dirs=[
			global.PROJECT_BIN,
			global.PROJECT_DEV,
			global.PROJECT_WEB,
			global.PROJECT_API,
			global.PROJECT_DEV,
			global.PROJECT_SYSTEM,
			global.PROJECT_ETC,
			global.PROJECT_TMP
		];
		util.makedirs(dirs,function() {
			update_modules(manifest,function() {
				global.manifest = manifest;
				if (process.argv.indexOf('auto#0') > -1) global._FIRST_TIME = 1; else global._FIRST_TIME = 0;
				server.start(manifest);
			});			
		});
	});
}();