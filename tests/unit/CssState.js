/* eslint-disable quote-props */
define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"delite/CssState"
], function (registerSuite, assert, register, CssState) {
	registerSuite({
		name: "CssState",

		"basic": function () {
			var CssWidget = register("css-widget", [HTMLElement, CssState], {
				state: "",
				disabled: false,
				checked: false
			});

			var widget = new CssWidget({
				state: "error",
				disabled: true,
				checked: true
			});
			widget.deliver();

			assert(widget.classList.contains("d-error"), "error state");
			assert(widget.classList.contains("d-disabled"), "disabled");
			assert(widget.classList.contains("d-checked"), "checked");

			widget.mix({
				state: "incomplete",
				disabled: false,
				checked: "mixed"
			});
			widget.deliver();

			assert(!widget.classList.contains("d-error"), "not error state");
			assert(widget.classList.contains("d-incomplete"), "incomplete state");
			assert.isFalse(widget.classList.contains("d-disabled"), "not disabled");
			assert(widget.classList.contains("d-mixed"), "half checked");
			assert.isFalse(widget.classList.contains("d-checked"), "original checked removed");
		}
	});
});
