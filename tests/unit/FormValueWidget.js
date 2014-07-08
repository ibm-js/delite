define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"delite/FormValueWidget"
], function (registerSuite, assert, register, FormValueWidget) {
	var FormValueWidgetTest = register("form-value-widget-test", [HTMLElement, FormValueWidget], {});
	var parentNode = document.body;

	registerSuite({
		name: "FormValueWidget",

		"handleOnChange": function () {
			var d = this.async(3000);
			initEventTest(d, "change").handleOnChange("change value");
			return d;
		},
		"handleOnInput": function () {
			var d = this.async(3000);
			initEventTest(d, "input").handleOnInput("input value");
			return d;
		}

	});
	
	function initEventTest(d, eventType) {
		var widget = new FormValueWidgetTest().placeAt(parentNode);
		widget.startup();

		var handler = d.callback(function (e) {
			assert.strictEqual(e.type, eventType);
		});

		parentNode.addEventListener(eventType, handler);

		d.then(function () {
			widget.destroy();
			parentNode.removeChild(widget);
			parentNode.removeEventListener(eventType, handler, false);
		});
		return widget;
	}
	
});