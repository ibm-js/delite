define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/helpers/pollUntil"
], function (require, intern, registerSuite, assert, pollUntil) {

	registerSuite({
		name: "webcomponents polyfill compatibility test",

		"setup": function () {
			return this.remote
				.get(require.toUrl("./webcomponents.html"))
				.then(pollUntil("return ready || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL))
				.sleep(100);		// wait for refresh
		},

		"widget created": function () {
			return this.remote
				.execute("return document.getElementById('example').textContent").then(function (value) {
					assert(/Example Widget/.test(value), "textContent (" + value + ") contains Example Widget");
				});
		}
	});
});
