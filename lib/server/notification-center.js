module.exports = function (app) {
	var fs = require('fs');
	var path = require('path');
	var sep = "/";
	app.get('/notification-center', function (req, res) {
		res.set('Content-Type', 'text/html');
		fs.readFile(__dirname + '/notification-center/index.html', function (err, b) {
			res.end(b.toString('utf-8'));
		});
	});
}