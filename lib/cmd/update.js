module.exports = function() {
	var emojic = require('emojic');
	const chalk = require('chalk');
	var fs = require('fs');
	var path = require('path');
	var sep = "/";
	
	var util = require('../util');
	var settings = require('../settings');

	require('../globals');
	
	console.log('\t'+emojic.whiteCheckMark+'  Updating server-side settings');
	
	fs.readFile(global.PROJECT_HOME + sep + 'app.manifest',function(e,r) {

		if (e) util.error("Can't find manifest");
		try {
			var manifest=JSON.parse(r.toString('utf-8'));
		} catch(e) {
			util.error('Manifest not readable');
		};
		
		settings.update(manifest,function() {
			console.log('	'+emojic.whiteCheckMark+'  Project updated.');
			console.log(' ');
		});
		
	});
	
}();