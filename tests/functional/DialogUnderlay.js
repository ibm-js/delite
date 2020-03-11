define([], function () {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;
	var pollUntil = requirejs.nodeRequire("@theintern/leadfoot/helpers/pollUntil").default;

	function clickMainScreen (remote) {
		return function () {
			// note: check specifically for iOS to workaround https://github.com/theintern/leadfoot/issues/62
			if (remote.environmentType.touchEnabled || remote.environmentType.platformName === "iOS") {
				return remote.pressFinger(15, 15).releaseFinger(15, 15);
			} else {
				return remote.findByCssSelector("h1").moveMouseTo().clickMouseButton().end();
			}
		};
	}

	registerSuite("DialogUnderlay functional tests", {
		before: function () {
			return this.remote.get("delite/tests/functional/DialogUnderlay.html")
				.then(pollUntil("return ready || null;", [], intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		tests: {
			basic: function () {
				if (this.remote.environmentType.browserName === "firefox") {
					return this.skip("firefox webdriver clicks elements behind the underlay, even though that " +
						"doesn't happen in real life");
				}
				if (this.remote.environmentType.touchEnabled || this.remote.environmentType.platformName === "iOS") {
					return this.skip("pressFinger() not supported on iOS, and doesn't generate click event on android");
				}
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
					.execute("showUnderlay.scrollIntoView();")
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
					.execute("hideUnderlay.scrollIntoView();")
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
		}
	});
});
