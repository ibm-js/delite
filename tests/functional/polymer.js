define([
	"intern!object",
	"intern/chai!assert",
	"require"
], function (registerSuite, assert, require) {

	registerSuite({
		name: "polymer compatibility test",

		"setup": function () {
			return this.remote
				.get(require.toUrl("./polymer.html"))
				.waitForCondition("ready", 40000);
		},

		"widget created": function () {
			return this.remote
				.execute("return document.getElementById('example').textContent")
				.then(function (value) {
					assert(/Example Widget/.test(value), "textContent (" + value + ") contains Example Widget")
				})
				.end();
		}
	});
});
