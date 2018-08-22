define([
	"intern!object",
	"intern/chai!assert",
	"requirejs-dplugins/jquery!attributes/classes",	// hasClass()
	"delite/register",
	"delite/CssState"
], function (registerSuite, assert, $, register, CssState) {
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

			assert($(widget).hasClass("d-error"), "error state");
			assert($(widget).hasClass("d-disabled"), "disabled");
			assert($(widget).hasClass("d-checked"), "checked");

			widget.mix({
				state: "incomplete",
				disabled: false,
				checked: "mixed"
			});
			widget.deliver();

			assert(!$(widget).hasClass("d-error"), "not error state");
			assert($(widget).hasClass("d-incomplete"), "incomplete state");
			assert.isFalse($(widget).hasClass("d-disabled"), "not disabled");
			assert($(widget).hasClass("d-mixed"), "half checked");
			assert.isFalse($(widget).hasClass("d-checked"), "original checked removed");
		}
	});
});
