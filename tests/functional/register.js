define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/helpers/pollUntil"
], function (require, intern, registerSuite, assert, pollUntil) {

	registerSuite({
		name: "register functional tests",

		"setup": function () {
			return this.remote
				.get(require.toUrl("./register.html"))
				.then(pollUntil("return ready || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

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
	});
});
