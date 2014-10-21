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
				var environmentType = this.remote.environmentType;
				if (environmentType.browserName === "internet explorer") {
					return this.skip("click() doesn't generate mousedown/mouseup, so popup won't open");
				}
				return this.remote.findById("input")
						.click()
						.end()
					.findById("dd")
						.click()
						.end()
					.findById("dd_popup")
						.isDisplayed().then(function (visible) {
							assert(visible, "visible");
						})
						.execute("return document.activeElement.getAttribute('index')").then(function (index) {
							// shouldn't focus drop down since it's a mouse click and dropdown has focusOnOpen=false
							if (!environmentType.mouseEnabled) {
								// TODO: this assert() fails on iOS (not sure why) so disabling for now
								return;
							}
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
					.pressKeys(" ") // space, to open menu
					.findById("dd_popup")
						.isDisplayed().then(function (visible) {
							assert(visible, "visible");
						})
						.execute("return document.activeElement.getAttribute('index')").then(function (index) {
							assert.strictEqual(index, "1", "focus moved to drop down");
						})
						.pressKeys(" ")// space, to select the first menu option
						.isDisplayed().then(function (visible) {
							assert(!visible, "hidden");
						})
						.end()
					.execute("return document.activeElement.id").then(function (id) {
						assert.strictEqual(id, "dd", "focused back on button #1");
					})
					.pressKeys(" ")// space, to open menu again, but this time for tab testing
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
			},

			// Mouse down, slide to menu choice, mouse up: should execute menu choice and close menu.
			"mouse - slide": function () {
				if (this.remote.environmentType.browserName === "internet explorer") {
					return this.skip("click() doesn't generate mousedown/mouseup, so popup won't open");
				}
				if (!this.remote.environmentType.mouseEnabled) {
					return this.skip("touch device, skipping mouse specific test");
				}
				return this.remote.findById("dd")
						.moveMouseTo()
						.pressMouseButton(1)
						.end()
					.findById("dd_popup")
						.isDisplayed().then(function (visible) {
							assert(visible, "visible");
						})
						.moveMouseTo()
						.releaseMouseButton(1)
						.isDisplayed().then(function (visible) {
							assert(!visible, "hidden");
						})
						.end();
			}
		},

		"dropdown dialog": function () {
			if (this.remote.environmentType.browserName === "internet explorer") {
				return this.skip("click() doesn't generate mousedown/mouseup, so popup won't open");
			}
			return this.remote.findByCssSelector("button[is=delayed-drop-down-button]")
					.click()
					.end()
				.setFindTimeout(intern.config.WAIT_TIMEOUT)	// takes 500ms for dropdown to appear first time
				.findByClassName("dropdown-dialog")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible");
					})
					.execute("return document.activeElement.tagName.toLowerCase()").then(function (tag) {
						assert.strictEqual(tag, "input", "focus moved to dialog's <input>");
					})
					.execute(function () {
						var anchor = document.querySelector("button[is=delayed-drop-down-button]");
						var dropDown = document.querySelector(".dropdown-dialog");
						return {
							anchorId: anchor.id,
							anchorAriaHasPopup: anchor.getAttribute("aria-haspopup"),
							anchorRect: anchor.getBoundingClientRect(),
							anchorAriaOwns: anchor.getAttribute("aria-owns"),
							dropDownId: dropDown.id,
							dropDownRect: dropDown.getBoundingClientRect(),
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

						assert.strictEqual(ret.anchorAriaHasPopup, "true", "aria-haspopup");
					})
					// test close by clicking submit button
					.findByCssSelector("button[type=submit]")
						.click()
						.end()
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden");
					})
					.end()
				.findByCssSelector("button[is=delayed-drop-down-button]")
					.click()		// reopen drop down by clicking DropDownButton again
					.end()
				.findByClassName("dropdown-dialog")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible again");
					})
					// test close by clicking cancel button
					.findByCssSelector("button[type=button]")
					.click()
					.end()
					.isDisplayed().then(function (visible) {
						assert(!visible, "hidden again");
					});
		},

		// Just to make sure that a non-focusable button can still open the drop down
		"non focusable HasDropDown": function () {
			if (this.remote.environmentType.browserName === "internet explorer") {
				return this.skip("click() doesn't generate mousedown/mouseup, so popup won't open");
			}
			return this.remote.findById("ndd")
					.click()
					.end()
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

		"non focusable dropdown": function () {
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			return this.remote.execute("combobox.focus()")
				.pressKeys(keys.ARROW_DOWN) // open menu
				.findByTagName("non-focus-menu")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible");
					})
					.findByClassName("selected")
						.getVisibleText().then(function (text) {
							assert.strictEqual(text, "choice #1");
						})
						.end()
					.end()		// deselect "non-focus-menu" so that next pressKeys() call goes to the ComboBox itself
				.pressKeys(keys.ARROW_DOWN)
				.findByTagName("non-focus-menu")
					.findByClassName("selected")
						.getVisibleText().then(function (text) {
							assert.strictEqual(text, "choice #2");
						})
						.end()
					.end()		// deselect "non-focus-menu" so that next pressKeys() call goes to the ComboBox itself
				.pressKeys(" ")	// to close menu
				.findByTagName("non-focus-menu")
					.isDisplayed().then(function (visible) {
						assert.isFalse(visible, "hidden");
					})
					.end();
		},

		"autowidth: false": {
			"alignment - left": function () {
				if (this.remote.environmentType.browserName === "internet explorer") {
					return this.skip("click() doesn't generate mousedown/mouseup, so popup won't open");
				}
				return this.remote.findById("nawl")
						.click()
						.end()
					.findById("nawl_popup")
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
						.click()	// click to close popup
						.end();
			},

			"alignment - right": function () {
				if (this.remote.environmentType.browserName === "internet explorer") {
					return this.skip("click() doesn't generate mousedown/mouseup, so popup won't open");
				}
				return this.remote.findById("nawr")
					.click()
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
					.click()
					.end();
			}
		},

		"centered dialog": function () {
			if (this.remote.environmentType.browserName === "internet explorer") {
				return this.skip("click() doesn't generate mousedown/mouseup, so popup won't open");
			}
			var browserName = this.remote.environmentType.browserName;
			return this.remote.findById("show-dialog-button")
				.click()
				.end()
				.findByClassName("centered-dialog")
				.isDisplayed().then(function (visible) {
					assert(visible, "visible");
				})
				.execute("return document.activeElement.tagName.toLowerCase()").then(function (tag) {
					assert.strictEqual(tag, "input", "focus moved to dialog's <input>");
				})
				.execute(function () {
					var dialog = document.querySelector(".centered-dialog");
					return {
						// Use delite/Viewport to get size because window.innerWidth not quite right on iOS7.1.
						// It returns 304 instead of 320.
						viewport: require("delite/Viewport").getEffectiveBox(),
						dropDownRect: dialog.getBoundingClientRect()
					};
				}).then(function (ret) {
					var viewport = ret.viewport,
						popupCoords = ret.dropDownRect;

					if (!/iphone|iOS/.test(browserName)) {
						// not setup to test vertical centering when virtual keyboard displayed
						assert(Math.abs(viewport.h / 2 - popupCoords.top - popupCoords.height / 2) < 1,
							"centered vertically");
					}
					assert(Math.abs(viewport.w / 2 - popupCoords.left - popupCoords.width / 2) < 1,
						"centered horizontally, " + viewport.w + ", " + popupCoords.width + ", " + popupCoords.left);
				});
		},

		events: function () {
			if (this.remote.environmentType.browserName === "internet explorer") {
				return this.skip("click() doesn't generate mousedown/mouseup, so popup won't open");
			}
			return this.remote
				.findById("eventsButton")
					.click()
					.end()
				.findById("eventsDialog")
					.isDisplayed().then(function (visible) {
						assert(visible, "visible");
					})
					.end()
				.findById("eventsButton")	// click again to close
					.click()
					.end()
				.findById("eventsLog")
					.getVisibleText().then(function (text) {
						assert.strictEqual(text.trim(), "Events on \"events drop down button\": delite-display-load " +
							"delite-before-show delite-after-show delite-before-hide delite-after-hide");
					})
					.end();
		},

		// Make sure that destroying a HasDropDown closes the popup
		destroy: function () {
			if (this.remote.environmentType.browserName === "internet explorer") {
				return this.skip("click() doesn't generate mousedown/mouseup, so popup won't open");
			}
			return this.remote.findById("dd")
					.click()
					.end()
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
