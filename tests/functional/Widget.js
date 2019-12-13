define([], function () {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;
	var pollUntil = requirejs.nodeRequire("@theintern/leadfoot/helpers/pollUntil").default;

	// Most of Widget's functionality is checked via the unit tests, but we have a functional test for checking
	// that focusin/focusout event handlers work.
	registerSuite("Widget functional tests", {
		before: function () {
			return this.remote
				.get("delite/tests/functional/Widget.html")
				.then(pollUntil("return ready || null;", [], intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		tests: {
			on: {
				focusin: function () {
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
					return this.remote
						.execute("document.querySelector('my-combobox').scrollIntoView();")
						.findByCssSelector("my-combobox input").click().end()
						.findById("focusEvents").getVisibleText().then(function (text) {
							assert.strictEqual(text, "1", "focus events");
						}).end();
				}
			}
		}
	});
});
