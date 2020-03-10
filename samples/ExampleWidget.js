define([
	"delite/register",
	"delite/CssState",
	"delite/handlebars!./ExampleWidget/ExampleWidget.html",
	"requirejs-dplugins/css!./ExampleWidget/ExampleWidget.css"
], function (register, CssState, template) {

	/**
	 * Example widget for testing and as template for new widgets.
	 * @class module:delite/samples/ExampleWidget
	 * @augments module:delite/CssState
	 */
	return register("d-example", [HTMLElement, CssState], {
		template: template,

		baseClass: "d-example-widget"
	});
});
