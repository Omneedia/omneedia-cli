module.exports = function() {
	var OS = require('os');
	var path = require('path');
	var sep = "/";
	var fs = require('fs');
	var shelljs = require('shelljs');
	
	var util = require('../util');
	
	var root = __dirname + sep + '..' + sep + '..';
	var isWin = /^win/.test(process.platform);
	
	var userdir = OS.homedir() + sep + "omneedia";
	var userdirdata = userdir + sep + "db";
	var pos = process.argv.indexOf('--mysql') + 1;
	var def = process.argv[pos];
	var pro = process.argv[pos + 1];
	if (!pro) pro = "default";
	userdirdata += sep + pro;	
	var data = userdirdata + sep + "data";
	
	function mysql_stop() {
		var pid = userdir + sep + "db" + sep + ".pid";
		fs.readFile(pid, function(e,r) {
			if (e) return console.log('  ! mySQL server seems not running\n'.red);	
			function displaymsg() {
				fs.unlink(pid,function() {
					console.log('- mySQL service stopped.\n'.green);					
				});	
			};
			var PID = r.toString('utf-8');
			if (!isWin) {
				shelljs.exec('kill -9 ' + PID, {
					silent: true
				}, displaymsg);
			}
			else {
				shelljs.exec('taskkill /F /PID ' + PID, {
					silent: true
				}, displaymsg);
			};			
		});
	};
	
	function mysql_start() {
		if (!isWin) {
			var pid = userdir + sep + "db" + sep + ".pid";
			shelljs.exec('nohup "' + root + sep + 'mysql' + sep + 'bin' + sep + 'mysqld" --defaults-file="' + userdirdata + sep + 'my.ini" -b "' + root + sep + 'mysql" --datadir="' + data + '" &>"' + userdirdata + sep + "my.log" + '" & echo $! > "' + pid + '"', {
				silent: true
			},function() {
				fs.readFile(pid, function(e,r) {
					var pido = r.toString('utf-8');
					fs.writeFile(pid,pido.trim(),function() {
						var msg = '- mySQL server running [PID ' + pido.trim() + ']\n';
						console.log(msg.green);
					});
				});
			});
		} else {
			/*var pid = userdir + sep + "db" + sep + ".pid";
			var _cmd = __dirname + sep + 'mysql' + sep + 'bin' + sep + 'mysqld --defaults-file=' + userdirdata + sep + 'my.ini -b ' + __dirname + sep + 'mysql --datadir=' + data;
			var cmd = 'start /b ' + _cmd;
			fs.writeFileSync(userdirdata + sep + 'mysql.cmd', cmd);
			var spawn = require('child_process').exec;
			spawn(userdirdata + sep + 'mysql.cmd', [], {
				detached: false
			});
			shelljs.exec("Wmic /output:\"" + pid + "\" process where (CommandLine like '%mysqld%') get Name,CommandLine,ProcessId");
			var _pid = fs.readFileSync(pid, 'ucs2').split('\r\n');
			var pido = -1;
			for (var i = 0; i < _pid.length; i++) {
				if (_pid[i].indexOf("my.ini") > -1) var pido = i;
			};
			if (pido != -1) {
				pido = _pid[pido].substr(_pid[pido].lastIndexOf('mysqld.exe') + 11, 255).trim();
				fs.writeFileSync(pid, pido);
				var msg = '- mySQL server running [PID ' + pido + ']\n';
			}
			else {
				var msg = '! mySQL not running\n';
				console.log(msg.yellow);
				return;
			}*/
		};
	};		
	
	function process_db() {
		switch(def) {
    		case "start":
        		mysql_start();
        		break;
    		case "stop":
        		mysql_stop();
        		break;
    		default:
		};
	};
	
	function init_db() {
		fs.stat(data + sep + "auto.cnf",function(e,r) {
			if (e) {
				console.log('- Init MySQL Server')
				shelljs.exec(root + sep + 'mysql' + sep + 'bin' + sep + 'mysqld --defaults-file="' + userdirdata + sep + 'my.ini" -b "' + __dirname + sep + 'mysql' + '" --datadir="' + data + '" --initialize-insecure',{silent:true},process_db);
			} else process_db();
		});
	};
	function conf_db() {
		var myini = [
			'[mysqld]',
			'sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES',
			'max_allowed_packet=160M',
			'innodb_force_recovery=0',
			'port=3306',
			'federated'			
		];		
		fs.writeFile(userdirdata + sep + "my.ini", myini.join('\r\n'),init_db);
	};
	util.mkdir(data, conf_db);
}();