define([], function () {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;
	var keys = requirejs.nodeRequire("@theintern/leadfoot/keys").default;
	var pollUntil = requirejs.nodeRequire("@theintern/leadfoot/helpers/pollUntil").default;

	registerSuite("on() functional tests", {
		before: function () {
			return this.remote
				.get("delite/tests/functional/on.html")
				.then(pollUntil("return ready || null;", [], intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		tests: {
			// Test that on(node, "focusin", ...) works on browsers that don't support "focusin" natively.
			// See also Widget.js tests.
			"focusin, focusout shim": function () {
				return this.remote
					.findById("f1").click().end()
					.findById("f2").click().end()
					.findById("f3").click().end()
					.execute("return focus_log.value;").then(function (log) {
						assert.strictEqual(log.trim(), "focusin focusout focusin focusout");
					});
			},

			// Test that on(node, "keydown", ...), etc. sets event.key correctly, even if the browser doesn't
			// support it natively.
			"event.key shim": {
				"keydown, keyup": function () {
					if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
						return this.skip("no keyboard support");
					}

					return this.remote.execute("document.getElementById('key').focus();")
						.pressKeys(keys.ARROW_DOWN)
						.execute("return keydown_log.value;").then(function (log) {
							assert.strictEqual(log, "ArrowDown");
						})
						.execute("return keyup_log.value;").then(function (log) {
							assert.strictEqual(log, "ArrowDown");
						})
						.pressKeys(keys.TAB)
						.execute("return keydown_log.value;").then(function (log) {
							assert.strictEqual(log, "Tab");
						})
						.execute("return keyup_log.value;").then(function (log) {
							assert.strictEqual(log, "Tab");
						})
						.pressKeys(keys.ESCAPE)
						.execute("return keydown_log.value;").then(function (log) {
							assert.strictEqual(log, "Escape");
						})
						.pressKeys(" ")
						.execute("return keydown_log.value;").then(function (log) {
							assert.strictEqual(log, "Spacebar");
						})
						.execute("return keyup_log.value;").then(function (log) {
							assert.strictEqual(log, "Spacebar");
						})
						.pressKeys(keys.BACKSPACE)
						.execute("return keydown_log.value;").then(function (log) {
							assert.strictEqual(log, "Backspace");
						})
						.pressKeys(keys.ENTER)
						.execute("return keydown_log.value;").then(function (log) {
							assert.strictEqual(log, "Enter");
						})
						.pressKeys("a")
						.execute("return keydown_log.value;").then(function (log) {
							assert.strictEqual(log, "a");
						})
						.pressKeys("z")
						.execute("return keyup_log.value;").then(function (log) {
							assert.strictEqual(log, "z");
						})
						.pressKeys("A")
						.execute("return keydown_log.value;").then(function (log) {
							assert.strictEqual(log, "A");
						})
						.pressKeys("Z")
						.execute("return keydown_log.value;").then(function (log) {
							assert.strictEqual(log, "Z");
						})
						.pressKeys("5")
						.execute("return keyup_log.value;").then(function (log) {
							assert.strictEqual(log, "5");
						});
				},
				keypress: function () {
					if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
						return this.skip("no keyboard support");
					}
					if (this.remote.environmentType.browserName === "chrome") {
						return this.skip("chrome webdriver doesn't generate keypress events when typing");
					}

					return this.remote.execute("keypress.focus();")
						.pressKeys("a")
						.execute("return keypress_log.value;").then(function (log) {
							assert.strictEqual(log, "a");
						})
						.pressKeys("z")
						.execute("return keypress_log.value;").then(function (log) {
							assert.strictEqual(log, "z");
						})
						.pressKeys("A")
						.execute("return keypress_log.value;").then(function (log) {
							assert.strictEqual(log, "A");
						})
						.pressKeys("Z")
						.execute("return keypress_log.value;").then(function (log) {
							assert.strictEqual(log, "Z");
						})
						.pressKeys("5")
						.execute("return keypress_log.value;").then(function (log) {
							assert.strictEqual(log, "5");
						});
				}
			}
		}
	});
});
