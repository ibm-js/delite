define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/keys",
	"intern/dojo/node!leadfoot/helpers/pollUntil"
], function (require, intern, registerSuite, assert, keys, pollUntil) {

	registerSuite({
		name: "activationTracker functional tests",

		setup: function () {
			return this.remote
				.get(require.toUrl("./activationTracker.html"))
				.then(pollUntil("return ready || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		beforeEach: function () {
			return this.remote.findById("clearButton")
				.click()
				.end()
				.sleep(100);	// because the clear button clears things on a setTimeout()
		},

		basic: function () {
			var environmentType = this.remote.environmentType;

			return this.remote
				.findById("activeStackChangeNotifications").getProperty("value").then(function (changes) {
					assert.strictEqual(changes, "0", "activeStack changes #0");
				}).end()
				.findById("first").click().end()
				.findById("activeStackChangeNotifications").getProperty("value").then(function (changes) {
					assert.strictEqual(changes, "1", "activeStack changes #1");
				}).end()
				.findById("activeStack").getProperty("value").then(function (activeStack) {
					assert.strictEqual(activeStack, "form, first", "activeStack #1");
				}).end()
				.findById("log").getProperty("value").then(function (log) {
					assert.strictEqual(log.trim(), "form activated", "log #1");
				}).end()
				.findById("second").click().end()	// focus another simple input
				.findById("activeStackChangeNotifications").getProperty("value").then(function (changes) {
					assert.strictEqual(changes, "2", "activeStack changes #2");
				}).end()
				.findById("activeStack").getProperty("value").then(function (activeStack) {
					assert.strictEqual(activeStack, "form, second", "activeStack #2");
				}).end()
				.findById("log").getProperty("value").then(function (log) {
					// Since the deliteful/Form widget didn't leave the focus chain it
					// shouldn't have any more events besides the original.
					assert.strictEqual(log.trim(), "form activated", "log #2");
				}).end()
				.findByCssSelector("#combobox input").click().end()	// focus combobox
				.findById("activeStackChangeNotifications").getProperty("value").then(function (changes) {
					assert.strictEqual(changes, "3", "activeStack changes #3");
				}).end()
				.findById("activeStack").getProperty("value").then(function (activeStack) {
					assert.strictEqual(activeStack, "form, fieldset1, combobox, input", "activeStack #3, " +
						JSON.stringify(environmentType));
				}).end()
				.findById("log").getProperty("value").then(function (log) {
					assert.strictEqual(log.trim(), "form activated\nfieldset1 activated\ncombobox activated", "log #3");
				}).end()
				.findByCssSelector("#combobox input").click().end()	// combobox again, to check for dup notifications
				.findById("activeStackChangeNotifications").getProperty("value").then(function (changes) {
					assert.strictEqual(changes, "3", "activeStack changes #4");
				}).end()
				.findByCssSelector("#editor iframe").click().end()
				.findById("activeStack").getProperty("value").then(function (activeStack) {
					// Safari doesn't add iframe to the list.  Squelch the error for now.
					if (environmentType.browserName === "safari") { return; }
					assert.strictEqual(activeStack, "form, editor, iframe", "activeStack #4");
				}).end()
				.findById("log").getProperty("value").then(function (log) {
					assert.strictEqual(log.trim(), "form activated\nfieldset1 activated\ncombobox activated\n" +
						"combobox deactivated\nfieldset1 deactivated\neditor activated", "log #4");
				}).end()

				// clicking spinner buttons should activate the spinner, even
				// though there's no actual DOM focus event
				.findByCssSelector("fake-spinner .button").click().end()
				.findById("activeStack").getProperty("value").then(function (activeStack) {
					if (environmentType.browserName === "internet explorer") {
						// click() doesn't generate pointerdown event on IE10+ and neither does
						// moveMouseTo().pressMouseButton(1).releaseMouseButton(1).
						// see https://github.com/theintern/leadfoot/issues/17.
						return;
					}
					if (environmentType.platformName === "iOS" || environmentType.browserName === "android") {
						// click() doesn't generate touchstart on iOS or android, see
						// https://github.com/theintern/leadfoot/issues/61
						return;
					}
					assert.strictEqual(activeStack, "form, fieldset2, spinner, span", "activeStack #5");
				}).end();
		},

		keyboard: function () {
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}

			return this.remote
				.findById("first").click().end()
				.findById("activeStack").getProperty("value").then(function (activeStack) {
					assert.strictEqual(activeStack, "form, first", "activeStack #1");
				}).end()
				.findById("log").getProperty("value").then(function (log) {
					assert.strictEqual(log.trim(), "form activated", "log #1");
				}).end()
				.pressKeys(keys.TAB)	// focus another simple input
				.findById("activeStack").getProperty("value").then(function (activeStack) {
					assert.strictEqual(activeStack, "form, second", "activeStack #2");
				}).end()
				.findById("log").getProperty("value").then(function (log) {
					// Since the deliteful/Form widget didn't leave the focus chain it
					// shouldn't have any more events besides the original.
					assert.strictEqual(log.trim(), "form activated", "log #2");
				}).end()
				.pressKeys(keys.TAB)	// focus combobox
				.findById("activeStack").getProperty("value").then(function (activeStack) {
					assert.strictEqual(activeStack, "form, fieldset1, combobox, input", "activeStack #3");
				}).end()
				.findById("log").getProperty("value").then(function (log) {
					assert.strictEqual(log.trim(), "form activated\nfieldset1 activated\ncombobox activated", "log #3");
				}).end()
				.findById("combobox").click().end()	// focus combobox again to check for duplicate notifications
				.findById("activeStackChangeNotifications").getProperty("value").then(function (changes) {
					assert.strictEqual(changes, "3", "activeStack changes #1");
				}).end();
		},

		dropdown: function () {
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
				.findById("activeStack").getProperty("value").then(function (activeStack) {
					if (environmentType.browserName === "internet explorer") {
						// click() doesn't generate pointerdown event on IE10+ and neither does
						// moveMouseTo().pressMouseButton(1).releaseMouseButton(1).
						// see https://github.com/theintern/leadfoot/issues/17.
						return;
					}
					if (environmentType.platformName === "iOS") {
						// click() doesn't generate touchstart on iOS, see
						// https://github.com/theintern/leadfoot/issues/61
						return;
					}
					assert.strictEqual(activeStack, "form, dropdownButton, popup", "activeStack #1");
				}).end();
		}
	});
});
