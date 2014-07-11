define([
	"intern!object",
	"intern/chai!assert",
	"require"
], function (registerSuite, assert, require) {

	registerSuite({
		name: "delite/dojo parser compatibility test",

		"setup": function () {
			return this.remote
				.get(require.toUrl("./DojoParser.html"))
				.waitForCondition("readyDijit && readyDelite", 30000);
		},
		"Dijit widgets" : {
			"declarative dijit widget" : function () {
				return this.remote
					.execute("return dijitRegistry.byId('dijitcalendardeclarative').id").then(function (value) {
						assert.strictEqual(value, "dijitcalendardeclarative", "declarative dijit widget exists");
					});
			},
			"programmatic dijit widget" : function () {
				return this.remote
					.execute("return dijitRegistry.byId('dijitprogrammaticid').id").then(function (value) {
						assert.strictEqual(value, "dijitprogrammaticid", "programmatic dijit widget exists");
					});

			},

			"all dijit widgets exist" : function () {
				return this.remote
					.execute("return dojoWidgetsLength").then(function (value) {
						assert.strictEqual(value, 2, "2 dijit widgets exist");
					});
			}
		},
		"Custom elements" : {
			// TODO: not sure this makes sense yet, test for register function to determine if it's a custom element?
			"programmatic custom element" : function () {
				return this.remote
					.execute("return typeof(document.getElementById('simplewidget').register)").then(function (value) {
						assert.strictEqual(value, "function", "simplewidget is a custom element");
					});

			},
			"declarative custom element" : function () {
				//document.getElementById("declarativecustomelement")
				return this.remote
					.execute("return typeof(document.getElementById('declarativecustomelement').register)")
						.then(function (value) {
						assert.strictEqual(value, "function", "declarativecustomelement is a custom element");
					});
			}
		}

	});
});
