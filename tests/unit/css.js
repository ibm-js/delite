define([
	"require",
	"intern!object",
	"intern/chai!assert"
], function (localRequire, registerSuite, assert) {

	// Note that as this test is running, other unrelated styles are likely being loaded
	// from other test suites that load widgets that use theme!.  Make test resilient to this.

	var container;

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
		name: "css",

		setup: function () {
			// For testing that css! loaded styles don't override user-defined styles
			document.head.insertAdjacentHTML("beforeend",
				"<style>.userDefined { border: 4px solid black; }</style>");

			assert.strictEqual(getStyles().match(/userDefined/g).length, 1, "userDefined CSS inserted");

			// Create some nodes for testing that styles are loaded correctly
			container = document.createElement("div");
			container.innerHTML =
				"<div class=test1 id=test1></div>" +
				"<div class='test1 userDefined' id=userDefined></div>";
			document.body.appendChild(container);
		},

		load: function () {
			var d = this.async(10000);

			// Load two modules that both use delite/css! to load test1.css
			localRequire([
				"./resources/TestCssWidget1",
				"./resources/TestCssWidget2"
			], d.callback(function () {
				// test1.css should be automatically loaded (but just once, not twice) by the time
				// this require() call completes.
				assert.strictEqual(getStyles().match(/test1/g).length, 1, "test1.css inserted once");

				// If stylesheet loaded, <div id=test1> should have a background-image defined.
				var backgroundImage = getComputedStyle(window.test1).backgroundImage;
				assert(backgroundImage, "stylesheet loaded");

				// Test that <style> nodes defined by app override the style that was loaded by css!
				assert.strictEqual(getComputedStyle(window.userDefined).borderLeftWidth, "4px",
						"user defined style wins: " + getStyles());
			}));

			return d;
		},

		reload: function () {
			var d = this.async(10000);

			// Load another modules that uses delite/css! to load the same test1.css,
			// just to triple check that the CSS doesn't get reloaded
			localRequire([
				"./resources/TestCssWidget3"
			], d.callback(function () {
				assert.strictEqual(getStyles().match(/test1/g).length, 1, "test1.css inserted once");
			}));

			return d;
		},

		concurrent: function () {
			var d = this.async(10000);

			// Load module with double dependency on test2.css
			localRequire([
				"./resources/TestCssWidget4"
			], d.callback(function () {
				// test2.css should be automatically loaded (but just once, not twice) by the time
				// this require() call completes.
				assert.strictEqual(getStyles().match(/test2/g).length, 1, "test2.css inserted once");
			}));

			return d;
		},

		loadLayer: function () {
			var d = this.async(10000);

			require.config({
				config: {
					"delite/css": {
						layersMap: {
							"delite/tests/unit/css/module5.css": "delite/tests/unit/css/layer.css"
						}
					}
				}
			});

			localRequire([
				"delite/css!./css/module5.css"
			], d.callback(function () {
				// layer.css should be loaded instead of module5.css
				assert.strictEqual(getStyles().match(/deliteLayer/g).length, 1, "layer.css inserted once");
			}));

			return d;
		},
		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
