define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/keys",
	"intern/dojo/node!leadfoot/helpers/pollUntil"
], function (require, intern, registerSuite, assert, keys, pollUntil) {

	registerSuite({
		name: "tabIndex functional tests",

		setup: function () {
			return this.remote
				.get(require.toUrl("./TabIndex.html"))
				.then(pollUntil("return ready || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		"default tab indices": function () {
			this.timeout = intern.config.TEST_TIMEOUT;
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			return this.remote.findById("d1").click()		// start on first element, before widgets
				.execute("return document.activeElement.id").then(function (value) {
					// start focus on the node before the two widgets
					assert.strictEqual(value, "d1");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// focused on <span> inside of widget
					assert.strictEqual(value, "d2");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// focused on <span> inside of widget
					assert.strictEqual(value, "d3");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.id").then(function (value) {
					assert.strictEqual(value, "d4");
				});
		},

		"specified tab indices": function () {
			this.timeout = intern.config.TEST_TIMEOUT;
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			return this.remote.findById("s1").click()		// start on first element, before widgets
				.execute("return document.activeElement.id").then(function (value) {
					// start focus on the node before the two widgets
					assert.strictEqual(value, "s1");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// focused on <span> inside of widget
					assert.strictEqual(value, "s2");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// focused on <span> inside of widget
					assert.strictEqual(value, "s3");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.id").then(function (value) {
					assert.strictEqual(value, "s4");
				});
		},

		"changed tab indices": function () {
			this.timeout = intern.config.TEST_TIMEOUT;
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			return this.remote.findById("button").click()	// click button to change tab indices
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// should have tabbed back to <span> inside first widget, which now has tabIndex=5
					assert.strictEqual(value, "s2");
				})
				.execute("return document.activeElement.innerHTML").then(function (value) {
					// making sure that observe() worked
					assert.strictEqual(value, "s2 widget, tabindex=1, updated to 5");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// should have tabbed back to <span> inside second widget, which now has tabIndex=6
					assert.strictEqual(value, "s3");
				});
		}
	});
});