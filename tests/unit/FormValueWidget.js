define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"delite/FormValueWidget"
], function (registerSuite, assert, register, FormValueWidget) {
	var container, FormValueWidgetTest, widget;

	registerSuite({
		name: "FormValueWidget",

		setup: function () {
			FormValueWidgetTest = register("form-value-widget-test", [HTMLElement, FormValueWidget], {});
		},

		beforeEach: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			widget = new FormValueWidgetTest().placeAt(container);
			widget.startup();
		},

		handleOnInput: function () {
			var d = this.async(3000);
			container.addEventListener("input", d.callback(function (e) {
				assert.strictEqual(e.type, "input");
			}));
			widget.handleOnInput("input value");
			return d;
		},

		handleOnChange: function () {
			var d = this.async(3000);
			container.addEventListener("change", d.callback(function (e) {
				assert.strictEqual(e.type, "change");
			}));
			widget.handleOnChange("change value");
			return d;
		},

		afterEach: function () {
			container.parentNode.removeChild(container);
		}
	});
});