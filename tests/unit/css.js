define([
	"require",
	"intern!object",
	"intern/chai!assert",
	"dojo/dom-style"
], function (require, registerSuite, assert, domStyle) {

	// Note that as this test is running, other unrelated styles are likely being loaded
	// from other test suites that load widgets that use theme!.  Make test resilient to this.

	var container;

	function getStyles() {
		// summary:
		//		Debugging method to get all the styles in the document.
		return Array.prototype.map.call(document.getElementsByTagName("style"), function (s) {
			return "<style>\n" + s.innerHTML.substr(0, 100) + "\n</style>";
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
				"<div class='test1 test2' id=test2></div>" +
				"<div class='test1 test2 test3' id=test3></div>" +
				"<div class='test1 test2 test3 userDefined' id=userDefined></div>" +
				"<span class=native></span>" +
				"<span class=encoded></span>";
			document.body.appendChild(container);
		},

		load: function () {
			var d = this.async(10000);

			// Load two modules that both use delite/css! to load test1.css
			require([
				"./resources/TestCssWidget1",
				"./resources/TestCssWidget2"
			], d.rejectOnError(function () {
				// test1.css should be automatically loaded (but just once, not twice) by the time
				// this require() call completes.
				assert.strictEqual(getStyles().match(/test1/g).length, 1, "test1.css inserted once");

				setTimeout(d.rejectOnError(function () {
					// If stylesheet loaded, <div id=test1> should have a background-image defined.
					var backgroundImage = domStyle.get("test1", "backgroundImage");
					assert(backgroundImage, "stylesheet loaded");

					// Test that <style> nodes defined by app override the style that was loaded by css!
					assert.equal(domStyle.get("userDefined", "borderLeftWidth"), "4", "user defined style wins: " +
						getStyles());

					// Test that image path was corrected to be relative to the document rather than the CSS file.
					// Do this by creating <img> node and see if it can load the specified image.
					//
					// Note: hard to check path directly because it changes based on the document's URL,
					// and the document's URL changes depending on how test is run.
					// When running directly from the browser the URL is:
					//		http://localhost/delite/node_modules/intern/client.html?...
					// When running from the command line, the URL is:
					//		http://localhost:9000/__intern/client.html?...
					// and the image path becomes /delite/...
					var path = backgroundImage.match(/url\(("|)([^"]+)("|)\)/)[2];
					var img = document.createElement("img");
					img.src = path;
					img.onload = function () {
						d.resolve(true);
					};
					img.onerror = function () {
						d.reject("image path " + path + " invalid");
					};
					container.appendChild(img);
				}), 10);
			}));

			return d;
		},

		reload: function () {
			var d = new this.async(1000);

			// Load another modules that uses delite/css! to load the same test1.css,
			// just to triple check that the CSS doesn't get reloaded
			require([
				"./resources/TestCssWidget3"
			], d.callback(function () {
				assert.strictEqual(getStyles().match(/test1/g).length, 1, "test1.css inserted once");
			}));

			return d;
		},

		multiple: function () {
			var d = new this.async(1000);

			// Load multiple CSS files via a comma separated list.
			// Make sure they appear in the specified order and that already loaded test1.css isn't reloaded.
			// Also tests that the new style nodes occur before the user defined style nodes.
			require([
				"delite/css!delite/tests/unit/css/test2.css," +
				"delite/tests/unit/css/test1.css," +
				"delite/tests/unit/css/test3.css"
			], d.callback(function () {
				// Test that each module loaded exactly once
				var styles = getStyles();
				assert.strictEqual(styles.match(/test1/g).length, 1, "test1.css inserted once");
				assert.strictEqual(styles.match(/test2/g).length, 1, "test2.css inserted once");
				assert.strictEqual(styles.match(/test3/g).length, 1, "test3.css inserted once");

				setTimeout(d.callback(function () {
					// Test that test3 overrides test2, etc.
					assert.equal(domStyle.get("test1", "borderLeftWidth"), "1", "test1 border-width");
					assert.equal(domStyle.get("test2", "borderLeftWidth"), "2", "test2 border-width");
					assert.equal(domStyle.get("test3", "borderLeftWidth"), "3", "test3 border-width");
					assert.equal(domStyle.get("userDefined", "borderLeftWidth"), "4", "userDefined border-width");
				}), 10);
			}));

			return d;
		},

		javascript: function () {
			var d = new this.async(1000);

			// Test loading JS file generated from CSS file
			require(["delite/css!delite/tests/unit/css/specialChars_css"], d.callback(function () {
				setTimeout(d.callback(function () {
					// specialChars defines the .native and .encoded classes with the same ::before content.
					// Check that content is defined correctly for each of those classes.
					// Hard to test directly, but we can check that each class produces the same width <span>.
					assert(window.native.offsetWidth > 0, "native content appears");
					assert(window.encoded.offsetWidth > 0, "encoded content appears");
					assert.strictEqual(window.native.offsetWidth, window.encoded.offsetWidth, "same width");
				}), 10);
			}));

			return d;
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
