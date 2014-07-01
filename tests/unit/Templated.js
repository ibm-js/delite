define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"delite/Templated",
	"delite/handlebars!./templates/HandlebarsButton.html"
], function (registerSuite, assert, register, Templated, buttonHBTmpl) {

	var container;

	registerSuite({

		name: "Templated",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		"template function": function () {
			// Test that function returned from delite/handlebars! creates the template correctly
			var TestButton = register("templated-function-button", [HTMLButtonElement, Templated], {
				iconClass: "originalClass",
				label: "original label",
				template: buttonHBTmpl
			});
			var myButton = new TestButton();
			assert.strictEqual(myButton.tagName.toLowerCase(), "button", "root node exists");
			assert.strictEqual(myButton.firstChild.tagName.toLowerCase(), "span", "icon node exists too");
			assert.strictEqual(myButton.firstChild.className, "d-reset originalClass", "icon class set");
			assert.strictEqual(myButton.textContent.trim(), "original label", "label set");
		},

		"template string": function () {
			// Test that function returned from delite/handlebars! creates the template correctly
			var TestButton = register("templated-string-button", [HTMLButtonElement, Templated], {
				iconClass: "originalClass",
				label: "original label",
				template: "<button>hello world</button>"
			});
			var myButton = new TestButton();
			assert.strictEqual(myButton.tagName.toLowerCase(), "button", "root node exists");
			assert.strictEqual(myButton.textContent.trim(), "hello world");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
