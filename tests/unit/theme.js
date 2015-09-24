define([
	"require",
	"requirejs-dplugins/Promise!",
	"intern!object",
	"intern/chai!assert"
], function (localRequire, Promise, registerSuite, assert) {

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

	var container;

	registerSuite({
		name: "theme",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		"common.css": {
			"test common.css loaded": function () {
				return new Promise(function (resolve) {
					// Load module that uses delite/theme! to indirectly load common.css.
					localRequire(["./resources/TestThemeWidget1"], resolve);
				}).then(function () {
					// common_css should be automatically loaded. It defines class d-reset (themes/common/classes.less)
					assert.strictEqual(getStyles().match(/d-reset/g).length, 1, "common is loaded");
				});
			},

			"d-hidden": function () {
				// check that d-hidden=true works, and overrides any user defined style
				container.insertAdjacentHTML("beforeEnd", "<div style='display:block' d-hidden=true></div>");
				var node = container.lastChild;
				assert.strictEqual(getComputedStyle(node).display, "none", "hidden");
			},

			"d-shown": function () {
				// check that d-shown=false works, and overrides any user defined style
				container.insertAdjacentHTML("beforeEnd", "<div style='display:block' d-shown=false></div>");
				var node = container.lastChild;
				assert.strictEqual(getComputedStyle(node).display, "none", "hidden");
			}
		},

		layers: function () {
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

			return new Promise(function (resolve) {
				localRequire(["delite/theme!./themes/{{theme}}/Button.css"], resolve);
			}).then(function () {
				// layer.css should be loaded instead of Button.css
				assert.strictEqual(getStyles().match(/deliteBootstrapLayer/g).length, 1, "layer.css inserted once");
			});
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
