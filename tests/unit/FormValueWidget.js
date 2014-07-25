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
			widget = new FormValueWidgetTest({
				value: "original value"
			}).placeAt(container);
			widget.startup();
		},

		handleOnInput: function () {
			var d = this.async(3000);

			var log = [];
			container.addEventListener("input", d.rejectOnError(function (e) {
				log.push(widget.value);
			}));

			widget.value = "input value 0";
			widget._onFocus();
			widget.handleOnInput("input value 1");
			widget.handleOnInput("input value 2");
			widget.handleOnInput("input value 3");

			setTimeout(d.callback(function (e){
				// test debouncing; should only get one notification, about the latest value
				assert.deepEqual(log, ["input value 3"]);
			}), 100);

			return d;
		},

		handleOnChange: function () {
			var d = this.async(3000);

			container.addEventListener("change", d.callback(function (e) {
				assert.strictEqual(e.type, "change");
			}));

			widget.value = "initial value";
			widget._onFocus();
			widget.handleOnChange("change value");

			return d;
		},

		// Test corner case where user sets value to same thing it was originally, by dragging a slider
		// handle but returning it to its original position before pointerup.
		noChange: function () {
			var d = this.async(3000);
			container.addEventListener("change", d.rejectOnError(function (e) {
				throw new Error("got change event");
			}));

			widget.value = "initial value";
			widget._onFocus();
			widget.handleOnChange("initial value");

			setTimeout(d.callback(function (){
				// if this timeout fires without seeing any change event, we are good
			}), 100);

			return d;
		},

		afterEach: function () {
			container.parentNode.removeChild(container);
		}
	});
});