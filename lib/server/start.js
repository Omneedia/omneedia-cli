module.exports = {
	io_connect: function(socket) {
		var response = {
			omneedia: {
				engine: global.$_VERSION
			}
			, session: socket.id
			, pid: global._SESSION_
		};
		global.OASocketonAuth = function (response) {
			var r = JSON.parse(response);
			if (!Clients.uid[r.uid]) Clients.uid[r.uid] = [];
			if (!Clients.mail[r.mail]) Clients.mail[r.mail] = [];
			if (Clients.uid[r.uid].indexOf(socket.id) == -1) Clients.uid[r.uid].push(socket.id);
			if (Clients.mail[r.mail].indexOf(socket.id) == -1) Clients.mail[r.mail].push(socket.id);
			app.IO.sockets.to(socket.id).emit("#auth", response);
		};
		socket.on('#create', function (room) {
			console.log("- " + room + " joined.");
			socket.join(room);
		});
		socket.on('#send', function (o) {
			o = JSON.parse(o);
			console.log(o);
			if (!o.users) {
				// on envoie qu'à la session en cours
				app.IO.sockets.to(socket.id).emit(o.uri, o.data);
			}
			else {
				if (Object.prototype.toString.call(o.users) === '[object Array]') {
					// on envoie qu'aux sockets des élus
					for (var i = 0; i < o.users.length; i++) {
						var _id = o.users[i];
						if (Clients.uid[_id]) {
							var tab = Clients.uid[_id];
							for (var j = 0; j < tab.length; j++) {
								app.IO.sockets.to(tab[j]).emit(o.uri, o.data);
							}
						};
						if (Clients.mail[_id]) {
							var tab = Clients.mail[_id];
							for (var j = 0; j < tab.length; j++) app.IO.sockets.to(tab[j]).emit(o.uri, o.data);
						};
					};
				}
				else {
					if (o.users == "*") {
						// on broadcast à tout le monde connecté à l'application
						app.IO.sockets.emit(o.uri, o.data);
					}
				}
			};
		});
		socket.emit('session', JSON.stringify(response));
	},
	display_index: function(req,res) {
		var fs = require('fs');
		var path = require('path');
		var sep = "/";
		var manifest = global.manifest;
		if (manifest.platform=="mobile") {
			if (req.originalUrl.indexOf("default")==-1) {
			var tpl=__dirname+sep+'mobile'+sep+'www'+sep+'index.tpl';
			fs.readFile(tpl,function(e,r) {
				if (e) res.status(404).send('Not found.');
				var html = r.toString('utf-8');
				html=html.replace(/{URL}/g,req.protocol+'://'+req.headers.host+'/default');
				html=html.replace(/{TITLE}/g,manifest.title);
				html=html.replace(/{DESCRIPTION}/g,manifest.description);
				html=html.replace(/{SYSTEM}/g,'ios');
				html=html.replace(/{TYPE}/g,'phone');
				html=html.replace(/{ORIENTATION}/g,'portrait');
				html=html.replace(/{VERSION}/g,manifest.version+'.'+manifest.build);
				html=html.replace(/{COPYRIGHT}/g,manifest.copyright);
				res.end(html);
			});
			return;	
			}
		};
		var tpl={};
		var reader = function(list,i,cb) {
			if (!list[i]) return cb();
			var obj=list[i];
			for (var el in obj) fs.readFile(obj[el],function(e,r) {
				if (r) tpl[el]=r.toString('utf-8');
				reader(list,i+1,cb);
			});
		};
		if (!manifest.bootstrap) manifest.bootstrap="";
		var list=[
			{"html": global.PROJECT_HOME+sep+'.template'},
			{"style": global.PROJECT_HOME+sep+'.style'},
			{"boot": __dirname + sep + '..' + sep+ '..' + sep + 'tpl' + sep + 'oa' + sep + 'bootstrap'+manifest.bootstrap+'.tpl'}
		];
		reader(list,0,function() {
			var _bt = tpl.boot;
			var _favicon = tpl.favicon;
			var _style = tpl.style;
			_style += '\t.omneedia-overlay{z-index: 9999999999;position:absolute;left:0px;top:0px;width:100%;height:100%;display:none;}\n';
			tpl.html = tpl.html.split('</head>')[0] + '<link rel="icon" href="/favicon.ico" type="image/x-icon"/><link rel="shortcut" href="/favicon.ico" type="image/x-icon"/><style>' + _style + "</style>"+tpl.boot+ "</head>" + tpl.html.split('</head>')[1];
			if (manifest.platform=="mobile") tpl.html = tpl.html.split('</body>')[0] + '<script type="text/javascript" src="/cordova.js"></script>' + '</body></html>';
			tpl.html = tpl.html.replace(/{COLOR}/g, manifest.splashscreen.background);
			tpl.html = tpl.html.replace(/{BKCOLOR}/g, manifest.splashscreen.color);
			tpl.html = tpl.html.replace(/{TITLE}/g, manifest.title);
			tpl.html = tpl.html.replace(/{DESCRIPTION}/g, manifest.description);
			tpl.html = tpl.html.replace(/{ICON}/g, "Contents/Resources/startup/logo.png");
			var minify = require('html-minifier').minify;
			res.end(minify(tpl.html.replace(/\t/g, '').replace(/\n/g, '')));
		});
	},
	start: function(manifest) {
		var fs = require('fs');
		var sep="/";
		var path = require('path');
		var emojic = require("emojic");
		var launcher=require('launch-browser');
		console.log('\t'+emojic.whiteCheckMark+'  Starting server');
				
		global.getIPAddress = function() {
			var interfaces = require('os').networkInterfaces();
			for (var devName in interfaces) {
				var iface = interfaces[devName];
				for (var i = 0; i < iface.length; i++) {
					var alias = iface[i];
					if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) return alias.address;
				}
			}
			return '127.0.0.1';			
		};
		
		Math = require('../framework/math')();
		Date = require('../framework/dates')();
		Object = require('../framework/objects')();
		Array = require('../framework/arrays')();
		
		require('../framework/utils');
		
		console.log('');
		
		var express = require('express');
		global.app = express();
		
		var http = require('http').createServer(app);
		
		if (process.args.debug) app.use(require('morgan')('dev'));
		
		// initialize socket.io
		
		app.IO = require('socket.io').listen(http);
		
		app.IO.on('connection', this.io_connect);
		
		// Upload
		var bodyParser = require('body-parser');
		app.use(bodyParser.json({
			limit: '5000mb'
			, extended: true
		}));
		app.use(bodyParser.urlencoded({
			limit: '5000mb'
			, extended: true
		}));
		
		var multer = require('multer');
		var storage = multer.diskStorage({
			destination: function (req, file, cb) {
				var OS = require('os');
				var path = require('path');
				var fs = require('fs');
				var userdir = OS.homedir() + sep + "omneedia";
				var upload_dir = userdir + sep + "uploads";
				fs.mkdir(upload_dir,function() {
					cb(null, upload_dir)
				});
			}
			, filename: function (req, file, cb) {
				cb(null, Math.uuid() + file.originalname.substr(file.originalname.lastIndexOf('.'), file.originalname.length));
			}
		});
		app.UPLOAD = multer({
			storage: storage
		});
		app.upload = app.UPLOAD;
		
		app.use(require('cookie-parser')());
		
		// bootstrap script
		app.get('/favicon.ico', function (req, res) {
			var IM = require("jimp");
			IM.read(global.PROJECT_HOME+sep+manifest.icon.file, function (err, img) {
				img.resize(16,16).getBuffer(IM.MIME_PNG, function(err, buffer){
             		res.set("Content-Type", 'image/x-icon');
             		res.send(buffer);
         		});
			});
		});
		app.get('/Contents/Resources/webapp/ico.png', function (req, res) {
			var IM = require("jimp");
			IM.read(global.PROJECT_HOME+sep+manifest.icon.file, function (err, img) {
				img.resize(16,16).getBuffer(IM.MIME_PNG, function(err, buffer){
             		res.set("Content-Type", 'image/x-icon');
             		res.send(buffer);
         		});
			});
		});		
		app.get('/Contents/Resources/startup/logo.png', function (req, res) {
			var IM = require("jimp");
			IM.read(global.PROJECT_HOME+sep+manifest.icon.file, function (err, img) {
				img.resize(256,256).getBuffer(IM.MIME_PNG, function(err, buffer){
             		res.set("Content-Type", 'image/x-icon');
             		res.send(buffer);
         		});
			});
		});		
		
		app.get('/', this.display_index);
		app.get('/index.html', this.display_index);
		app.get('/index.htm', this.display_index);
		
		app.get('/default', this.display_index);
		
		// MOBILE SPECIFIC
		
		if (manifest.platform=="mobile") require('./mobile.js')(app,express);
		
		// API
		require('./api.js')(app);
		
		// Server process
		require('./system.js')(app,express);
		
		// AUTH
		var setmeup = require('../settings');
		setmeup.update(manifest,function(settings) {
			global.settings = settings;
			require('./auth.js')(app);
		});	
		
		// request
		global.request = require('../framework/request');
		
		app.use(require('cors')());
		app.use(require('compression')());

		var OS = require('os');
		
		var userdir = OS.homedir() + sep + "omneedia";
		
		// Local CDN
		
		var git_dir = userdir + sep + "omneedia.github.io";
		
		fs.mkdir(git_dir,function() {
			app.use('/cdn', express.static(git_dir));
		})
		
		// Session		
		var session_dir = userdir + sep + "session";
		
		var Session = require('express-session');
		var SessionStore = require('session-file-store')(Session);

		app.use(express.static(PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Application'));
		app.use('/Contents/Culture',express.static(PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Culture'));
		app.use('/Contents/Application',express.static(PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Application'));
		app.use('/Contents/Resources',express.static(PROJECT_HOME + sep + 'src' + sep + 'Contents' + sep + 'Resources'));
		
		var do_settings=require(__dirname+sep+'..'+sep+'settings-client.js');
		do_settings(app);
		
		fs.mkdir(session_dir,function() {
			
			var session = Session({
				store: new SessionStore({
					path: session_dir
				})
				, secret: 'pass'
				, resave: true
				, saveUninitialized: true
			});
			app.use(session);			
			
			app.use(require('errorhandler')({
				dumpExceptions: true
				, showStack: true
			}));		

			if (_FIRST_TIME == 1) launcher('http://127.0.0.1:'+manifest.server.port, { browser: ['chrome', 'firefox', 'safari'] }, 
			function(e, browser){
					if(e) return console.log(e);
					browser.on('stop', function(code){
						console.log( 'Browser closed with exit code:', code );
					});    
			});

			http.listen(manifest.server.port);
		});
		
	}
};