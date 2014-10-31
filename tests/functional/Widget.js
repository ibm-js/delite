define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/keys",
	"intern/dojo/node!leadfoot/helpers/pollUntil",
], function (require, intern, registerSuite, assert, keys, pollUntil) {

	// Most of Widget's functionality is checked via the unit tests, but we have a functional test for checking
	// that focusin/focusout event handlers works.
	registerSuite({
		name: "Widget functional tests",

		setup: function () {
			return this.remote
				.get(require.toUrl("./Widget.html"))
				.then(pollUntil("return ready || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		on: {
			focusin: function () {
				this.timeout = intern.config.TEST_TIMEOUT;
				return this.remote
					.findById("before").click().end()
					.findByCssSelector("my-content-pane input.first").click().end()
					.findByCssSelector("my-content-pane input.second").click().end()
					.findById("after").click().end()
					.findById("focusinEvents").getVisibleText().then(function (text) {
						assert.strictEqual(text, "2", "focusin events");
					}).end()
					.findById("focusoutEvents").getVisibleText().then(function (text) {
						assert.strictEqual(text, "2", "focusout events");
					}).end();
			},

			focus: function () {
				this.timeout = intern.config.TEST_TIMEOUT;
				return this.remote
					.findByCssSelector("my-combobox input").click().end()
					.findById("focusEvents").getVisibleText().then(function (text) {
						assert.strictEqual(text, "1", "focus events");
					}).end();
			}
		}
	});
});