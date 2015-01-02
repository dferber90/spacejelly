// from underscore.string

module.exports = {
	containsStr: function (str, needle) {
		if (needle === '') return true;
		if (str == null) return false;
		return String(str).indexOf(needle) !== -1;
	},

	startsWith: function (str, starts){
		if (starts === '') return true;
		if (str == null || starts == null) return false;
		str = String(str); starts = String(starts);
		return str.length >= starts.length && str.slice(0, starts.length) === starts;
	}
}