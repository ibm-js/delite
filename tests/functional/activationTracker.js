define([], function () {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;
	var keys = requirejs.nodeRequire("@theintern/leadfoot/keys").default;
	var pollUntil = requirejs.nodeRequire("@theintern/leadfoot/helpers/pollUntil").default;

	registerSuite("activationTracker functional tests", {
		before: function () {
			return this.remote
				.get("delite/tests/functional/activationTracker.html")
				.then(pollUntil("return ready || null;", [], intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		beforeEach: function () {
			return this.remote.findById("clearButton")
				.click()
				.end()
				.sleep(100);	// because the clear button clears things on a setTimeout()
		},

		tests: {
			"basic": function () {
				var environmentType = this.remote.environmentType;

				return this.remote
					.execute("return document.getElementById('activeStackChanges').value;").then(function (changes) {
						assert.strictEqual(changes, "0", "activeStack changes #0");
					})
					.findById("first").click().end()
					.execute("return document.getElementById('activeStackChanges').value;").then(function (changes) {
						assert.strictEqual(changes, "1", "activeStack changes #1");
					})
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						assert.strictEqual(activeStack, "form, first", "activeStack #1");
					})
					.execute("return document.getElementById('log').value;").then(function (log) {
						assert.strictEqual(log.trim(), "form activated", "log #1");
					})
					.findById("second").click().end()	// focus another simple input
					.execute("return document.getElementById('activeStackChanges').value;").then(function (changes) {
						assert.strictEqual(changes, "2", "activeStack changes #2");
					})
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						assert.strictEqual(activeStack, "form, second", "activeStack #2");
					})
					.execute("return document.getElementById('log').value;").then(function (log) {
						// Since the deliteful/Form widget didn't leave the focus chain it
						// shouldn't have any more events besides the original.
						assert.strictEqual(log.trim(), "form activated", "log #2");
					})
					.findByCssSelector("#combobox input").click().end()	// focus combobox
					.execute("return document.getElementById('activeStackChanges').value;").then(function (changes) {
						assert.strictEqual(changes, "3", "activeStack changes #3");
					})
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						assert.strictEqual(activeStack, "form, fieldset1, combobox, input", "activeStack #3");
					})
					.execute("return document.getElementById('log').value;").then(function (log) {
						assert.strictEqual(log.trim(),
							"form activated\nfieldset1 activated\ncombobox activated", "log #3");
					})
					.findByCssSelector("#combobox input").click().end()	// to check for dup notifications
					.execute("return document.getElementById('activeStackChanges').value;").then(function (changes) {
						assert.strictEqual(changes, "3", "activeStack changes #4");
					})
					.findByCssSelector("#editor div").click().end()
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						assert.strictEqual(activeStack, "form, editor, div", "activeStack #4");
					})
					.execute("return document.getElementById('log').value;").then(function (log) {
						assert.strictEqual(log.trim(), "form activated\nfieldset1 activated\ncombobox activated\n" +
							"combobox deactivated\nfieldset1 deactivated\neditor activated", "log #4");
					})

					// clicking spinner buttons should activate the spinner, even
					// though there's no actual DOM focus event
					.findByCssSelector("fake-spinner .button").click().end()
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						if (environmentType.brokenMouseEvents) {
							// click() doesn't generate pointerdown event on IE10+ and neither does
							// moveMouseTo().pressMouseButton(1).releaseMouseButton(1).
							// see https://github.com/theintern/leadfoot/issues/17.
							return;
						}
						if (environmentType.platformName === "iOS" || environmentType.platform === "ANDROID") {
							// click() doesn't generate touchstart on iOS or android, see
							// https://github.com/theintern/leadfoot/issues/61
							return;
						}
						assert.strictEqual(activeStack, "form, fieldset2, spinner, span", "activeStack #5");
					});
			},

			"keyboard": function () {
				if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
					return this.skip("no keyboard support");
				}

				return this.remote
					.findById("first").click().end()
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						assert.strictEqual(activeStack, "form, first", "activeStack #1");
					})
					.execute("return document.getElementById('log').value;").then(function (log) {
						assert.strictEqual(log.trim(), "form activated", "log #1");
					})
					.pressKeys(keys.TAB)	// focus another simple input
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						assert.strictEqual(activeStack, "form, second", "activeStack #2");
					})
					.execute("return document.getElementById('log').value;").then(function (log) {
						// Since the deliteful/Form widget didn't leave the focus chain it
						// shouldn't have any more events besides the original.
						assert.strictEqual(log.trim(), "form activated", "log #2");
					})
					.pressKeys(keys.TAB)	// focus combobox
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						assert.strictEqual(activeStack, "form, fieldset1, combobox, input", "activeStack #3");
					})
					.execute("return document.getElementById('log').value;").then(function (log) {
						assert.strictEqual(log.trim(),
							"form activated\nfieldset1 activated\ncombobox activated", "log #3");
					})
					.findById("combobox").click().end()	// focus combobox again to check for duplicate notifications
					.execute("return document.getElementById('activeStackChanges').value;").then(function (changes) {
						assert.strictEqual(changes, "3", "activeStack changes #1");
					});
			},

			"dropdown": function () {
				var environmentType = this.remote.environmentType;

				return this.remote
					.execute("document.getElementById('dropdownButton').scrollIntoView();")
					.findById("dropdownButton").click().end()
					.findByCssSelector("fake-popup")
						.isDisplayed().then(function (visible) {
							assert(visible, "popup visible");
						})
						.click()
						.end()
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						if (environmentType.brokenMouseEvents) {
							// click() doesn't generate pointerdown event on IE10+ and neither does
							// moveMouseTo().pressMouseButton(1).releaseMouseButton(1).
							// see https://github.com/theintern/leadfoot/issues/17.
							return;
						}
						if (environmentType.platformName === "iOS" || environmentType.platform === "ANDROID") {
							// click() doesn't generate touchstart on iOS, see
							// https://github.com/theintern/leadfoot/issues/61
							return;
						}
						assert.strictEqual(activeStack, "form, dropdownButton, popup", "activeStack #1");
					});
			},

			"hover": function () {
				// note: check specifically for iOS to workaround https://github.com/theintern/leadfoot/issues/62
				if (!this.remote.environmentType.mouseEnabled || this.remote.environmentType.platformName === "iOS") {
					return this.skip("touch device, skipping mouse specific test");
				}

				return this.remote
					.execute("document.getElementById('hoverDropdownButton').scrollIntoView();")
					.findByCssSelector("#hoverDropdownButton span:nth-child(1)").moveMouseTo().end()
					.sleep(1000)
					.execute("return document.getElementById('hoverDropdownButton').log").then(function (log) {
						assert.deepEqual(log, [
							"this delite-hover-activated",
							"child 1 delite-hover-activated"
						], "button hovered");
					})
					.findById("hoverPopup").isDisplayed().then(function (visible) {
						assert(visible, "popup visible");
					}).end()
					.findByCssSelector("#hoverDropdownButton span:nth-child(2)").moveMouseTo().end()
					.sleep(1000)
					.execute("return document.getElementById('hoverDropdownButton').log").then(function (log) {
						assert.deepEqual(log, [
							"this delite-hover-activated",
							"child 1 delite-hover-activated",
							"child 1 delite-hover-deactivated",
							"child 2 delite-hover-activated"
						], "checking delite-hover-activated doesn't bubble to root node");
					})
					.findById("hoverPopup").isDisplayed().then(function (visible) {
						assert(visible, "popup still visible");
					}).moveMouseTo().end()
					.sleep(1000)
					.execute("return document.getElementById('hoverDropdownButton').log").then(function (log) {
						assert.deepEqual(log, [
							"this delite-hover-activated",
							"child 1 delite-hover-activated",
							"child 1 delite-hover-deactivated",
							"child 2 delite-hover-activated",
							"child 2 delite-hover-deactivated",
							"popup delite-hover-activated"
						], "hover stack works with popups");
					})
					.findById("clearButton").moveMouseTo().end()
					.sleep(1000)
					.execute("return document.getElementById('hoverDropdownButton').log").then(function (log) {
						assert.deepEqual(log, [
							"this delite-hover-activated",
							"child 1 delite-hover-activated",
							"child 1 delite-hover-deactivated",
							"child 2 delite-hover-activated",
							"child 2 delite-hover-deactivated",
							"popup delite-hover-activated",
							"popup delite-hover-deactivated",
							"this delite-hover-deactivated"
						], "everything unhovered");
					});
			},

			"detaching hovered/active nodes": function () {
				return this.remote
					// Test that detaching active (and hovered) node removes it from the activeStack/hoverStack.
					.findById("removeMe").click().end()
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						assert.strictEqual(activeStack, "grandparent, parent", "activeStack #1");
					})
					.execute("return document.getElementById('hoverStack').value;").then(function (activeStack) {
						assert.strictEqual(activeStack, "grandparent, parent", "hoverStack #1");
					})

					// Test that detaching parent of active (and hovered) node
					// removes it from the activeStack/hoverStack.
					.findById("removeMyParent").click().end()
					.execute("return document.getElementById('activeStack').value;").then(function (activeStack) {
						assert.strictEqual(activeStack, "grandparent", "activeStack #2");
					})
					.execute("return document.getElementById('hoverStack').value;").then(function (hoverStack) {
						assert.strictEqual(hoverStack, "grandparent", "hoverStack #2");
					});
			}
		}
	});
});
