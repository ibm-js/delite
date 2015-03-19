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
			FormValueWidgetTest = register("form-value-widget-test", [HTMLElement, FormValueWidget], {
				render: function () {
					this.focusNode = this.ownerDocument.createElement("input");
					this.appendChild(this.focusNode);
					this.valueNode = this.ownerDocument.createElement("input");
					this.valueNode.type = "hidden";
					this.appendChild(this.valueNode);
				}
			});
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		"change and input events": {
			beforeEach: function () {
				widget = new FormValueWidgetTest({
					value: "original value"
				}).placeAt(container);
			},

			handleOnInput: function () {
				var d = this.async(3000);

				var log = [];
				container.addEventListener("input", d.rejectOnError(function () {
					log.push(widget.value);
				}));

				widget.value = "input value 0";
				widget.emit("delite-activated");
				widget.handleOnInput("input value 1");
				widget.handleOnInput("input value 2");
				widget.handleOnInput("input value 3");

				setTimeout(d.callback(function () {
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
				widget.emit("delite-activated");
				widget.handleOnChange("change value");

				return d;
			},

			// Test corner case where user sets value to same thing it was originally, by dragging a slider
			// handle but returning it to its original position before pointerup.
			noChange: function () {
				var d = this.async(3000);
				container.addEventListener("change", d.rejectOnError(function () {
					throw new Error("got change event");
				}));

				widget.value = "initial value";
				widget.emit("delite-activated");
				widget.handleOnChange("initial value");

				setTimeout(d.callback(function () {
					// if this timeout fires without seeing any change event, we are good
				}), 100);

				return d;
			},

			// Test corner case where user changes value but then changes it back before there's a notification.
			changeThenRevert: function () {
				var d = this.async(3000);
				container.addEventListener("change", d.rejectOnError(function () {
					throw new Error("got change event");
				}));

				widget.value = "initial value";
				widget.emit("delite-activated");
				widget.handleOnChange("new value");
				widget.handleOnChange("initial value");

				setTimeout(d.callback(function () {
					// if this timeout fires without seeing any change event, we are good
				}), 100);

				return d;
			}
		},

		readonly: function () {
			var myWidget = new FormValueWidgetTest();

			myWidget.readOnly = true;
			myWidget.deliver();
			assert(myWidget.focusNode.readOnly, "readOnly set on focusNode");

			myWidget.readOnly = false;
			myWidget.deliver();
			assert.isFalse(myWidget.focusNode.readOnly, "readOnly not set on focusNode");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});