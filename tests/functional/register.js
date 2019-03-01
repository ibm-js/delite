define([
	"require"
], function (
	require
) {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;
	var pollUntil = require("@theintern/leadfoot/helpers/pollUntil").default;

	registerSuite("register functional tests", {
		before: function () {
			return this.remote
				.get(require.toUrl("delite/tests/functional/register.html"))
				.then(pollUntil("return ready || null;", [], intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		tests: {
			"custom element created": function () {
				return this.remote
					.execute(function () {
						return document.getElementById("myCustomElement")._constructorCalled;
					}).then(function (value) {
						assert(value, "custom element created");
					})
					.execute(function () {
						return document.getElementById("myCustomElement")._connectedCallbackCalled;
					}).then(function (value) {
						assert(value, "custom element attached");
					});
			}
		}
	});
});
