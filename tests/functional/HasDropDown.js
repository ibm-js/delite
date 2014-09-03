define([
	"require",
	"intern!object",
	"intern/chai!assert"
], function (require, registerSuite, assert) {

	registerSuite({
		name: "HasDropDown functional tests",

		setup: function () {
			return this.remote
				.get(require.toUrl("./HasDropDown.html"))
				.waitForCondition("window && window.ready", 40000);
		},

		"basic menu drop down": {
			mouse: function () {
				if (this.remote.environmentType.browserName === "internet explorer") {
					// click() and clickElement() don't work on IE because they don't generate the mousedown
					// mouseup events.   And buttonDown()/buttonUp() don't work either, for unknown reasons.
					// It does work when manually tested on IE.
					return;
				}
				return this.remote.elementById("input")
						.clickElement()
						.end()
					.elementById("dd")
						.clickElement()
						.end()
					.elementById("dd_popup")
						.isDisplayed().then(function (visible) {
							assert(visible, "visible");
						})
						.execute("return document.activeElement.getAttribute('index')").then(function (index) {
							// shouldn't focus drop down since it's a mouse click and dropdown has focusOnOpen=false
							assert.notStrictEqual(index, "1", "focus didn't move to drop down");
						})
						.execute(function () {
							return {
								anchor: document.getElementById("dd").getBoundingClientRect(),
								dropDown: document.getElementById("dd_popup").getBoundingClientRect()
							};
						}).then(function (pos) {
							assert(Math.abs(pos.anchor.left - pos.dropDown.left) < 1,
								"drop down and anchor left aligned");
							assert(Math.abs(pos.anchor.width - pos.dropDown.width) < 1,
								"drop down same width as anchor");
						})
						.clickElement()
						.isDisplayed().then(function (visible) {
							assert(!visible, "hidden");
						})
						.end();
			},

			keyboard: function () {
				if (/safari|iphone/.test(this.remote.environmentType.browserName)) {
					// SafariDriver doesn't support tabbing, https://code.google.com/p/selenium/issues/detail?id=5403
					return;
				}
				return this.remote.execute("dd.focus()")
					.keys(" ") // space, to open menu
					.elementById("dd_popup")
						.isDisplayed().then(function (visible) {
							assert(visible, "visible");
						})
						.execute("return document.activeElement.getAttribute('index')").then(function (index) {
							assert.strictEqual(index, "1", "focus moved to drop down");
						})
						.keys(" ")// space, to select the first menu option
						.isDisplayed().then(function (visible) {
							assert(!visible, "hidden");
						})
						.end()
					.execute("return document.activeElement.id").then(function (id) {
						assert.strictEqual(id, "dd", "focused back on button #1");
					})
					.keys(" ")// space, to open menu again, but this time for tab testing
					.elementById("dd_popup")
						.isDisplayed().then(function (visible) {
							assert(visible, "visible again");
						})
						.execute("return document.activeElement.getAttribute('index')").then(function (index) {
							assert.strictEqual(index, "1", "focus moved to drop down");
						})
						.keys("\uE004")// tab away, to cancel menu
						.isDisplayed().then(function (visible) {
							assert(!visible, "hidden again");
						})
						.end()
					.execute("return document.activeElement.id").then(function (id) {
						assert.strictEqual(id, "dd", "focused back on button #2");
					});
			},

			// Mouse down, slide to menu choice, mouse up: should execute menu choice and close menu.
			"mouse - slide": function () {
				if (/internet explorer|iphone/.test(this.remote.environmentType.browserName)) {
					// buttonDown()/buttonUp() doesn't work on IE or safari
					return;
				}
				if (/safari/.test(this.remote.environmentType.browserName)) {
					// moveTo() doesn't work on safari
					return;
				}
				return this.remote.elementById("dd")
						.moveTo()
						.buttonDown()
						.end()
					.elementById("dd_popup")
						.isDisplayed().then(function (visible) {
							assert(visible, "visible");
						})
						.moveTo()
						.buttonUp()
						.isDisplayed().then(function (visible) {
							assert(!visible, "hidden");
						})
						.end();
			}
		},

		"basic tooltip dialog": function () {
			if (this.remote.environmentType.browserName === "internet explorer") {
				// click() and clickElement() don't work on IE because they don't generate the mousedown
				// mouseup events.   And buttonDown()/buttonUp() don't work either, for unknown reasons.
				// It does work when manually tested on IE.
				return;
			}
			var browserName = this.remote.environmentType.browserName;
			return this.remote.elementById("rdd")
					.clickElement()
					.end()
				.waitForElementById("rdd_popup", 2000, 500)	// takes 500ms for dropdown to appear first time
				.elementById("rdd_popup")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible");
					})
					.execute("return document.activeElement.tagName.toLowerCase()").then(function (tag) {
						// Test that focus worked even though the mouseup happened before the dialog appeared.
						// Disable for saucelabs iphone because it reports focus as <body>; unclear why, since it
						// works when I tested it locally. (TODO)
						if (/iphone/.test(browserName)) {
							return;
						}
						assert.strictEqual(tag, "input", "focus moved to tooltip's <input>");
					})
					.execute(function () {
						return {
							anchor: document.getElementById("rdd").getBoundingClientRect(),
							dropDown: document.getElementById("rdd_popup").getBoundingClientRect()
						};
					}).then(function (pos) {
						// dropdown is RTL, but should align the same due to the autoWidth: true default setting
						assert(Math.abs(pos.anchor.left - pos.dropDown.left) < 1, "drop down and anchor left aligned");
						assert(Math.abs(pos.anchor.width - pos.dropDown.width) < 1, "drop down same width as anchor");
					})
					// test close by clicking submit button
					.elementByCssSelector("button[type=submit]")
						.clickElement()
						.end()
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden");
					})
					.end()
				.elementById("rdd")
					.clickElement()		// reopen drop down by clicking DropDownButton again
					.end()
				.elementById("rdd_popup")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible again");
					})
					// test close by clicking cancel button
					.elementByCssSelector("button[type=button]")
					.clickElement()
					.end()
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden again");
					});
		},

		// Just to make sure that a non-focusable button can still open the drop down
		"non focusable": function () {
			if (this.remote.environmentType.browserName === "internet explorer") {
				// click() and clickElement() don't work on IE because they don't generate the mousedown
				// mouseup events.   And buttonDown()/buttonUp() don't work either, for unknown reasons.
				// It does work when manually tested on IE.
				return;
			}
			return this.remote.elementById("ndd")
					.clickElement()
					.end()
				.elementById("ndd_popup")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible");
					})
					.clickElement()
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden");
					})
					.end();
		},

		"autowidth: false": {
			"alignment - left": function () {
				if (this.remote.environmentType.browserName === "internet explorer") {
					// click() and clickElement() don't work on IE because they don't generate the mousedown
					// mouseup events.   And buttonDown()/buttonUp() don't work either, for unknown reasons.
					// It does work when manually tested on IE.
					return;
				}
				return this.remote.elementById("nawl")
						.clickElement()
						.end()
					.elementById("nawl_popup")
						.isDisplayed().then(function (visible) {
							assert(visible, "visible");
						})
						.execute(function () {
							return {
								anchor: document.getElementById("nawl").getBoundingClientRect(),
								dropDown: document.getElementById("nawl_popup").getBoundingClientRect()
							};
						}).then(function (pos) {
							assert(Math.abs(pos.anchor.left - pos.dropDown.left) < 1,
								"drop down and anchor left aligned, anchor = " + pos.anchor.left  +
								", dropDown = " + pos.dropDown.left);
							assert(pos.anchor.width > pos.dropDown.width, "anchor wider than drop down");
						})
						.clickElement()	// click to close popup
						.end();
			},

			"alignment - right": function () {
				if (this.remote.environmentType.browserName === "internet explorer") {
					// click() and clickElement() don't work on IE because they don't generate the mousedown
					// mouseup events.   And buttonDown()/buttonUp() don't work either, for unknown reasons.
					// It does work when manually tested on IE.
					return;
				}
				return this.remote.elementById("nawr")
					.clickElement()
					.execute(function () {
						return {
							anchor: document.getElementById("nawr").getBoundingClientRect(),
							dropDown: document.getElementById("nawr_popup").getBoundingClientRect()
						};
					}).then(function (pos) {
						assert(Math.abs((pos.anchor.left + pos.anchor.width) -
								(pos.dropDown.left + pos.dropDown.width)) < 1, "drop down and anchor right aligned");
						assert(pos.anchor.width > pos.dropDown.width, "anchor wider than drop down");
					})
					// Click HasDropDown button again to close popup.  Note that this could be interpreted
					// as a double click?
					.clickElement()
					.end();
			}
		},

		// Make sure that destroying a HasDropDown closes the popup
		destroy: function () {
			if (this.remote.environmentType.browserName === "internet explorer") {
				// click() and clickElement() don't work on IE because they don't generate the mousedown
				// mouseup events.   And buttonDown()/buttonUp() don't work either, for unknown reasons.
				// It does work when manually tested on IE.
				return;
			}
			return this.remote.elementById("dd")
				.clickElement()
				.end()
				.elementById("dd_popup")
				.isDisplayed().then(function (visible) {
					assert(visible, "visible");
				})
				.end()
				.execute("return require('delite/popup')._stack.length").then(function (length) {
					assert.strictEqual(length, 1, "in popup manager stack");
				})
				.execute("dd.destroy(); return require('delite/popup')._stack.length").then(function (length) {
					assert.strictEqual(length, 0, "popup was closed");
				});
		}
	});
});
