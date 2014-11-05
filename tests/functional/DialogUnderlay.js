define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/keys",
	"intern/dojo/node!leadfoot/helpers/pollUntil"
], function (require, intern, registerSuite, assert, keys, pollUntil) {

	function clickMainScreen(remote) {
		return function () {
			if (remote.environmentType.touchEnabled) {
				// Not supported on iOS yet!
				// return remote.pressFinger(5, 5);
			}
			return remote.findByCssSelector("h1").moveMouseTo().clickMouseButton().end();
		};
	}

	registerSuite({
		name: "DialogUnderlay functional tests",

		setup: function () {
			return this.remote.get(require.toUrl("./DialogUnderlay.html")).then(pollUntil("return ready || null;", [],
				intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		basic: function () {
			if (this.remote.environmentType.browserName === "firefox") {
				return this.skip("firefox webdriver clicks elements behind the underlay, even though that " +
					"doesn't happen in real life");
			}
			this.timeout = intern.config.TEST_TIMEOUT;
			return this.remote
				// First make sure that when the underlay isn't showing I can click the button and it executes.
				.then(clickMainScreen(this.remote))
				.findById("clicksOnMainPage")
					.getVisibleText()
					.then(function (text) {
						assert.strictEqual(text, "1", "no underlay");
					})
					.end()

				// Now show the underlay, and try to click the button again
				.findById("showUnderlay")
					.click()
					.end()
				.then(clickMainScreen(this.remote))
				.findById("clicksOnMainPage")
					.getVisibleText()
					.then(function (text) {
						assert.strictEqual(text, "1", "underlay shown");
					})
					.end()

				// Now hide the underlay, and try to click the button again
				.findById("hideUnderlay")
					.click()
					.end()
				.then(clickMainScreen(this.remote))
				.findById("clicksOnMainPage")
					.getVisibleText()
					.then(function (text) {
						assert.strictEqual(text, "2", "no underlay");
					})
					.end()

				// Now show the underlay again, and try to click the button again
				.findById("showUnderlay")
					.click()
					.end()
				.then(clickMainScreen(this.remote))
				.findById("clicksOnMainPage")
					.getVisibleText()
					.then(function (text) {
						assert.strictEqual(text, "2", "underlay shown again");
					})
					.end();
		}
	});
});
