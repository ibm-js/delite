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
				.execute("return document.getElementById('outside')._createdCallbackCalled").then(function (value) {
					assert(value, "custom element created");
				})
				.execute("return document.getElementById('outside')._attachedCallbackCalled").then(function (value) {
					assert(value, "custom element attached");
				});

		},

		"template": function () {
			return this.remote
				.execute("var children = document.querySelector('template').children; " +
					"return children ? children.length : 0;").then(function (value) {
					assert.strictEqual(value, 0, "<template> children removed (if they existed in the first place)");
				})
				.execute("return document.querySelector('template').content.querySelector('*').tagName").then(
						function (value) {
					assert.strictEqual(value.toLowerCase(), "test-widget", "children moved to .content property");
				})
				.execute(
					"return '_createdCallbackCalled' in document.querySelector('template').content.querySelector('*')")
					.then(function (value) {
					assert.isFalse(value, "custom element in template not upgraded");
				});
		}

	});
});
