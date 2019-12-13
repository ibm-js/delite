define([], function () {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;
	var pollUntil = requirejs.nodeRequire("@theintern/leadfoot/helpers/pollUntil").default;

	registerSuite("FormValueWidget functional tests", {
		before: function () {
			return this.remote
				.get("delite/tests/functional/FormValueWidget.html")
				.then(pollUntil("return ready || null;", [], intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		tests: {
			creation: function () {
				return this.remote.execute("return spinner1.value").then(function (value) {
					assert.equal(value, 5, "original value");	// taken from the embedded <input>
				}).execute("return spinner1.name").then(function (name) {
					assert.strictEqual(name, "spinner1_name", "name");
				});
			},

			reset: function () {
				return this.remote.findByCssSelector("my-spinner .increment")
					.click()
					.end()
					.execute("return spinner1.value").then(function (value) {
						assert.equal(value, 6, "incremented value");	// use equal() to ignore string vs. number diff
					})
					.findByCssSelector("#resetB")
					.click()
					.end()
					.execute("return spinner1.value").then(function (value) {
						assert.equal(value, 5, "reset value");	// use equal() to ignore string vs. number diff
					});
			}
		}
	});
});
