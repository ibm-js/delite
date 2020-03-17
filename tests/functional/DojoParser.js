define([], function () {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;
	var pollUntil = requirejs.nodeRequire("@theintern/leadfoot/helpers/pollUntil").default;

	registerSuite("delite/dojo parser compatibility test", {
		before: function () {
			return this.remote
				.get("delite/tests/functional/DojoParser.html")
				.then(pollUntil("return (readyDijit && readyDelite) || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		tests: {
			"Dijit widgets": {
				"declarative dijit widget": function () {
					return this.remote
						.execute("return dijitRegistry.byId('dijitcalendardeclarative').id").then(function (value) {
							assert.strictEqual(value, "dijitcalendardeclarative", "declarative dijit widget exists");
						});
				},

				"programmatic dijit widget": function () {
					return this.remote
						.execute("return dijitRegistry.byId('dijitprogrammaticid').id").then(function (value) {
							assert.strictEqual(value, "dijitprogrammaticid", "programmatic dijit widget exists");
						});
				},

				"all dijit widgets exist": function () {
					return this.remote
						.execute("return dojoWidgetsLength").then(function (value) {
							assert.strictEqual(value, 2, "2 dijit widgets exist");
						});
				}
			},

			"Custom elements": {
				"programmatic custom element": function () {
					return this.remote
						.execute("return typeof(document.getElementById('simplewidget').initializeRendering)")
						.then(function (value) {
							assert.strictEqual(value, "function", "simplewidget is a delite custom element");
						});
				},

				"declarative custom element": function () {
					return this.remote
						.execute("return typeof(document.getElementById('declarativecustomelement').initializeRendering)")
						.then(function (value) {
							assert.strictEqual(value, "function",
								"declarativecustomelement is a delite custom element");
						});
				}
			}
		}
	});
});
