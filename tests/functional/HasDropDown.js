define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/keys",
	"intern/dojo/node!leadfoot/helpers/pollUntil"
], function (require, intern, registerSuite, assert, keys, pollUntil) {

	registerSuite({
		name: "HasDropDown functional tests",

		setup: function () {
			return this.remote
				.get(require.toUrl("./HasDropDown.html"))
				.then(pollUntil("return ready || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		"basic menu drop down": {
			mouse: function () {
				var mobile = /ios|android/i.test(this.remote.environmentType.platformName);
				return this.remote
					.findById("input").click().end()
					.findById("dd").click().end()
					.findById("dd_popup")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible");
					})
					.execute(function () {
						return document.activeElement.getAttribute("index");
					}).then(mobile ? function () {} : function (index) {
						// Shouldn't focus drop down since it's a mouse click
						// and dropdown has focusOnPointerOpen=false.
						// Exception: currently, on mobile dropdown is always focused, see HasDropDown#openDropDown().
						assert.notStrictEqual(index, "1", "focus didn't move to drop down");
					})
					.execute(function () {
						var anchor = document.getElementById("dd").getBoundingClientRect();
						var dropDown = document.getElementById("dd_popup").getBoundingClientRect();
						return {
							anchor: {left: anchor.left, width: anchor.width},
							dropDown: {left: dropDown.left, width: dropDown.width}
						};
					}).then(function (pos) {
						assert(Math.abs(pos.anchor.left - pos.dropDown.left) < 1,
							"drop down and anchor left aligned");
						assert(Math.abs(pos.anchor.width - pos.dropDown.width) < 1,
							"drop down same width as anchor " + pos.anchor.width + " vs " + pos.dropDown.width);
					})
					.click()
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden");
					})
					.end();
			},

			keyboard: function () {
				if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
					return this.skip("no keyboard support");
				}
				return this.remote.execute("dd.focus()")
					.pressKeys(keys.SPACE) // open menu
					.findById("dd_popup")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible");
					})
					.execute("return document.activeElement.getAttribute('index')").then(function (index) {
						assert.strictEqual(index, "1", "focus moved to drop down");
					})
					.pressKeys(keys.SPACE)// select the first menu option
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden");
					})
					.end()
					.execute("return document.activeElement.id").then(function (id) {
						assert.strictEqual(id, "dd", "focused back on button #1");
					})
					.pressKeys(keys.SPACE)// open menu again, but this time for tab testing
					.findById("dd_popup")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible again");
					})
					.execute("return document.activeElement.getAttribute('index')").then(function (index) {
						assert.strictEqual(index, "1", "focus moved to drop down");
					})
					.pressKeys(keys.TAB)// tab away, to cancel menu
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden again");
					})
					.end()
					.execute("return document.activeElement.id").then(function (id) {
						assert.strictEqual(id, "dd", "focused back on button #2");
					});
			}
		},

		"dropdown dialog": function () {
			return this.remote
				.findByCssSelector("delayed-drop-down-button").click().end()
				.setFindTimeout(intern.config.WAIT_TIMEOUT)	// takes 500ms for dropdown to appear first time
				.findByClassName("dropdown-dialog")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible");
					})
					.execute("return document.activeElement.tagName.toLowerCase()").then(function (tag) {
						assert.strictEqual(tag, "input", "focus moved to dialog's <input>");
					})
					.execute(function () {
						var anchor = document.querySelector("delayed-drop-down-button");
						var dropDown = document.querySelector(".dropdown-dialog");

						var anchorRect = anchor.getBoundingClientRect();
						var dropDownRect = dropDown.getBoundingClientRect();

						return {
							anchorId: anchor.id,
							anchorAriaHasPopup: anchor.getAttribute("aria-haspopup"),
							anchorRect: {left: anchorRect.left, width: anchorRect.width},
							anchorAriaOwns: anchor.getAttribute("aria-owns"),
							dropDownId: dropDown.id,
							dropDownRect: {left: dropDownRect.left, width: dropDownRect.width},
							dropDownLabelledBy: dropDown.getAttribute("aria-labelledby")
						};
					}).then(function (ret) {
						// dropdown is RTL, but should align the same due to the autoWidth: true default setting
						assert(Math.abs(ret.anchorRect.left - ret.dropDownRect.left) < 1,
							"drop down and anchor left aligned");
						assert(Math.abs(ret.anchorRect.width - ret.dropDownRect.width) < 1,
							"drop down same width as anchor");

						// check tha aria-owns points from button to dropdown, even though there was no id
						// specified for the button or the drop down
						assert(ret.anchorId, "anchor has generated id");
						assert(ret.dropDownId, "dropdown has generated id");
						assert.strictEqual(ret.anchorAriaOwns, ret.dropDownId, "aria-owns points to dropdown id");
						assert.strictEqual(ret.dropDownLabelledBy, ret.anchorId, "aria-labelledby --> anchor id");

						assert.strictEqual(ret.anchorAriaHasPopup, "dialog", "aria-haspopup");
					})
					// test close by clicking submit button
					.findByCssSelector("button[type=submit]").click().end()
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden");
					})
					.end()
				// reopen drop down by clicking DropDownButton again
				.findByCssSelector("delayed-drop-down-button").click().end()
				.findByClassName("dropdown-dialog")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible again");
					})
					// test close by clicking cancel button
					.findByCssSelector("button[type=button]").click().end()
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden again");
					});
		},

		// Just to make sure that a non-focusable button can still open the drop down
		"non focusable HasDropDown": function () {
			return this.remote
				.findById("ndd").click().end()
				.findById("ndd_popup")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible");
					})
					.click()
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden");
					})
					.end();
		},

		// Test for Combobox type widget where focus stays on the widget and events are forwarded to the dropdown.
		"non focusable dropdown": {
			basic: function () {
				if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
					return this.skip("no keyboard support");
				}
				return this.remote.execute(function () {
						document.keydownEvents = 0;
						document.body.onkeydown = function () { document.keydownEvents++; };
						document.getElementById("combobox").focus();
					})
					.pressKeys(keys.ARROW_DOWN) // open menu
					.findByTagName("non-focus-menu").isDisplayed().then(function (visible) {
						assert(visible, "visible");
					}).end()
					.findByCssSelector("non-focus-menu .selected").getVisibleText().then(function (text) {
						assert.strictEqual(text, "choice #1");
					}).end()
					.execute("return document.keydownEvents").then(function (count) {
						assert.strictEqual(count, 0, "no keydown events bubbled to body");
					})
					.pressKeys(keys.ARROW_DOWN)
					.findByCssSelector("non-focus-menu .selected").getVisibleText().then(function (text) {
						assert.strictEqual(text, "choice #2");
					}).end()
					.execute("return document.keydownEvents;").then(function (count) {
						assert.strictEqual(count, 0, "no keydown events bubbled to body");
					})
					.pressKeys(keys.ENTER)	// to close menu
					.findByTagName("non-focus-menu").isDisplayed().then(function (visible) {
						assert.isFalse(visible, "hidden");
					}).end();
			},

			escape: function () {
				if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
					return this.skip("no keyboard support");
				}
				return this.remote.execute(function () {
						document.keydownEvents = 0;
						document.body.onkeydown = function () { document.keydownEvents++; };
						document.getElementById("combobox").focus();
					})
					.pressKeys(keys.ARROW_DOWN) // open menu
					.execute("return document.keydownEvents;").then(function (count) {
						assert.strictEqual(count, 0, "no keydown events bubbled to body");
					})
					.findByTagName("non-focus-menu").isDisplayed().then(function (visible) {
						assert(visible, "visible");
					}).end()
					.pressKeys(keys.ESCAPE)	// to close menu
					.execute("return document.keydownEvents;").then(function (count) {
						assert.strictEqual(count, 0, "no keydown events bubbled to body");
					})
					.findByTagName("non-focus-menu").isDisplayed().then(function (visible) {
						assert.isFalse(visible, "hidden");
					}).end();
			}
		},

		"autowidth: false": {
			"alignment - left": function () {
				return this.remote
					.findById("nawl").click().end()
					.findById("nawl_popup")
						.isDisplayed().then(function (visible) {
							assert(visible, "visible");
						})
						.execute(function () {
							var anchor = document.getElementById("nawl").getBoundingClientRect();
							var dropDown = document.getElementById("nawl_popup").getBoundingClientRect();
							return {
								anchor: {left: anchor.left, width: anchor.width},
								dropDown: {left: dropDown.left, width: dropDown.width}
							};
						}).then(function (pos) {
							assert(Math.abs(pos.anchor.left - pos.dropDown.left) < 1,
								"drop down and anchor left aligned, anchor = " + pos.anchor.left  +
								", dropDown = " + pos.dropDown.left);
							assert(pos.anchor.width > pos.dropDown.width, "anchor wider than drop down");
						})
						.click()		// close popup
						.end();
			},

			"alignment - right": function () {
				return this.remote
					.findById("nawr").click().end()
					.execute(function () {
						var anchor = document.getElementById("nawr").getBoundingClientRect();
						var dropDown = document.getElementById("nawr_popup").getBoundingClientRect();
						return {
							anchor: {right: anchor.right, width: anchor.width},
							dropDown: {right: dropDown.right, width: dropDown.width}
						};
					}).then(function (pos) {
						assert(Math.abs(pos.anchor.right - pos.dropDown.right) < 1,
							"drop down and anchor right aligned, anchor = " + pos.anchor.right  +
							", dropDown = " + pos.dropDown.right);
						assert(pos.anchor.width > pos.dropDown.width, "anchor wider than drop down");
					})
					.findById("nawr").click().end();	// close popup
			}
		},

		"centered dialog": function () {
			var environmentType = this.remote.environmentType;

			return this.remote
				.findById("show-dialog-button").click().end()
				.findByClassName("centered-dialog")
				.isDisplayed().then(function (visible) {
					assert(visible, "visible");
				})
				.execute("return document.activeElement.tagName.toLowerCase();").then(function (tag) {
					assert.strictEqual(tag, "input", "focus moved to dialog's <input>");
				})
				.execute(function () {
					// note: "return node.getBoundingClientRect();" doesn't work on IE; webdriver bug.
					var dropDownRect = document.querySelector(".centered-dialog").getBoundingClientRect();
					return {
						// Use delite/Viewport to get size because window.innerWidth not quite right on iOS7.1.
						// It returns 304 instead of 320.
						viewport: require("delite/Viewport").getEffectiveBox(),
						dropDownRect:  {
							left: dropDownRect.left,
							width: dropDownRect.width,
							top: dropDownRect.top,
							height: dropDownRect.height
						}
					};
				})
				.then(function (ret) {
					var viewport = ret.viewport,
						popupCoords = ret.dropDownRect;

					if (environmentType.platformName !== "iOS") {
						// not setup to test vertical centering when virtual keyboard displayed
						assert(Math.abs(viewport.h / 2 - popupCoords.top - popupCoords.height / 2) < 1,
							"centered vertically");
					}
					assert(Math.abs(viewport.w / 2 - popupCoords.left - popupCoords.width / 2) < 1,
						"centered horizontally, " + viewport.w + ", " + popupCoords.width + ", " + popupCoords.left);
				})
				// close dialog, otherwise next test will fail
				.findByCssSelector(".centered-dialog button[type=submit]").click().end();
		},

		events: function () {
			return this.remote
				.findById("eventsButton").click().end()
				.findById("eventsDialog")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible");
					})
					.end()
				.findById("eventsButton").click().end()	// click again to close
				.execute(function () {
					var childNodes = document.querySelector("#eventsLog").childNodes;
					return Array.prototype.filter.call(childNodes, function (child) {
						return child.nodeType === 3;
					}).map(function (textNode) {
						return textNode.textContent;
					});
				}).then(function (text) {
					assert.deepEqual(text, [
						"delite-display-load",
						"delite-before-show",
						"delite-after-show",
						"delite-before-hide",
						"delite-after-hide"
					]);
				});
		},

		// Test that HasDropDown can be used to apply dropdown behavior to a random node.
		behavior: function () {
			return this.remote
				.findById("behavior-button").click().end()
				.findByCssSelector("[aria-labelledby=behavior-button]")
				.isDisplayed().then(function (visible) {
					assert(visible, "visible");
				})
				.execute("return document.activeElement.tagName.toLowerCase()").then(function (tag) {
					assert.strictEqual(tag, "input", "focus moved to dialog's <input>");
				})
				.end()
				// test close by clicking another node on the screen
				.findById("input").click().end()
				.findByCssSelector("[aria-labelledby=behavior-button]")
				.isDisplayed().then(function (visible) {
					assert(!visible, "hidden");
				})
				.end();
		},

		"combo button": function () {
			return this.remote
				// Clicking right half of button should show popup, but underneath entire button.
				.findById("cbr").click().end()
				.findById("cbr_popup").isDisplayed().then(function (visible) {
					assert(visible, "popup shown");
				}).end()
				.execute(function () {
					return {
						buttonLeft: document.getElementById("cb").getBoundingClientRect().left,
						popupLeft: document.getElementById("cbr_popup").getBoundingClientRect().left
					};
				}).then(function (res) {
					assert.strictEqual(Math.round(res.buttonLeft), Math.round(res.popupLeft),
						"popup left aligned with entire combobutton, not the HasDropDown node");
				})

				// Clicking left half of button should hide popup.
				.findById("cbl").click().end()
				.findById("cbr_popup").isDisplayed().then(function (visible) {
					assert.isFalse(visible, "popup hidden");
				}).end();
		},

		// Make sure that destroying a HasDropDown closes the popup
		destroy: function () {
			return this.remote
				.findById("dd").click().end()
				.findById("dd_popup")
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
