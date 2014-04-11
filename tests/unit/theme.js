define([
	"require",
	"intern!object",
	"intern/chai!assert"
], function (require, registerSuite, assert) {
	
	function getStyles() {
		// summary:
		//		Debugging method to get all the styles in the document.
		return Array.prototype.map.call(document.getElementsByTagName("style"),function (s) {
			return "<style>\n" + s.innerHTML.substr(0, 100) + "\n</style>";
		}).join("\n");
	}
	
	registerSuite({
		name: "theme",
		"load global_css": function () {
			var d = new this.async(1000);
			// Load one module that use delite/theme! to load global_css
			require([
				"./resources/TestThemeWidget1"
			], d.callback(function () {
				// global_css should be automatically loaded. It defines class d-reset (themes/common/global.less)
				assert.strictEqual(getStyles().match(/d-reset/g).length, 1, "global_css is loaded");
			}));
			return d;
		}
	});
});
