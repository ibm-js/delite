define([
	"require",
	"intern!object",
	"intern/chai!assert"
], function (localRequire, registerSuite, assert) {

	function getStyles() {
		// summary:
		//		Debugging method to get all the styles in the document.
		var sheets = document.styleSheets;
		return Array.prototype.map.call(sheets, function (s) {
			var rules = s.cssRules || s.rules;
			return Array.prototype.map.call(rules, function (r) {
				return r.cssText;
			});
		}).join("\n");
	}

	registerSuite({
		name: "theme",

		"load common_css": function () {
			var d = new this.async(1000);
			// Load one module that use delite/theme! to load common_css
			localRequire([
				"./resources/TestThemeWidget1"
			], d.callback(function () {
				// common_css should be automatically loaded. It defines class d-reset (themes/common/classes.less)
				assert.strictEqual(getStyles().match(/d-reset/g).length, 1, "common is loaded");
			}));
			return d;
		},

		loadLayer: function () {
			var d = this.async(10000);
			var layer = "delite/tests/unit/themes/{{theme}}/layer.css";

			require.config({
				config: {
					"delite/theme": {
						layersMap: {
							"delite/tests/unit/themes/{{theme}}/Button.css": layer,
							"delite/themes/{{theme}}/common.css": layer
						}
					}
				}
			});

			localRequire([
				"delite/theme!./themes/{{theme}}/Button.css"
			], d.callback(function () {
				// layer.css should be loaded instead of Button.css
				assert.strictEqual(getStyles().match(/deliteBootstrapLayer/g).length, 1, "layer.css inserted once");
			}));

			return d;
		}
	});
});
