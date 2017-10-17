module.exports = function() {
	Array.prototype.diff = function (a) {
		return this.filter(function (i) {
			return a.indexOf(i) < 0;
		});
	};
	return Array;
}