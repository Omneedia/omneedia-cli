module.exports = {
	display: function(step) {
		var colors=require('colors');
		var chalk = require('chalk');
		console.log(' ');
		if (step=="config") {
			console.log('Usage: oa config [options]'.yellow);
			console.log('       options: '.green);
			console.log('       set item value \t\t(ex: oa config set proxy http://myproxy.com)'.white);
			console.log('');
			console.log('');
			process.exit();
		}
		if (step=="create") {
			console.log('Usage: oa create <namespace> <TPL> [--tpl git]'.yellow);
			console.log('       TPL:	'.green+chalk.bgGreen('  webapp  ')+' create a web app'.white);
			console.log('		'.green+chalk.bgGreen('  mobile  ')+' create a mobile app (ios,android,windows)'.white);
			console.log('		'.green+chalk.bgGreen('  desktop ')+' create a desktop app (windows,macos,linux)'.white);
			console.log('		'.green+chalk.bgGreen(' services ')+' create microservices'.white);
			console.log(' ');
			console.log('       EX:	'.green+'oa create com.demo.helloworld webapp'.white);
			console.log('          	'.green+'oa create global/com.demo.helloworld webapp'.white);
			console.log('');
			console.log('');
			process.exit();			
		}
	}
};