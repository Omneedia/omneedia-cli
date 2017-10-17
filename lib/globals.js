module.exports = function() {
	
	var path = require('path');
	var sep = "/";
	
	global.ROOT = __dirname + sep + '..';
	global.PROJECT_HOME = process.cwd();
	global.PROJECT_BIN = PROJECT_HOME + sep + "bin";
	global.PROJECT_DEV = PROJECT_HOME + sep + "dev";
	global.PROJECT_WEB = PROJECT_HOME + sep + "src";
	global.PROJECT_ETC = PROJECT_HOME + sep + "etc";
	global.PROJECT_TMP = PROJECT_HOME + sep + "tmp";
	global.PROJECT_APP = PROJECT_WEB + sep + 'Contents' + sep + 'Application';
	global.PROJECT_AUTH = PROJECT_WEB + sep + 'Contents' + sep + 'Auth';
	global.PROJECT_API = PROJECT_WEB + sep + "Contents" + sep + "Services";
	global.PROJECT_RES = PROJECT_WEB + sep + 'Contents' + sep + 'Resources';
	global.PROJECT_DEV = PROJECT_HOME + sep + "dev";
	global.PROJECT_SYSTEM = PROJECT_WEB + sep + "System";	

}();