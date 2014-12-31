// from underscore.string

module.exports = {
	containsStr: function (str, needle) {
		if (needle === '') return true;
		if (str == null) return false;
		return String(str).indexOf(needle) !== -1;
	}
}