module.exports = function() {
	var request = require('request');
	var Request = {};
	if (global.CFG.current.proxy) var Request = request.defaults({
		'proxy': global.CFG.current.proxy
	});
	else Request = request;
	return Request;
}();