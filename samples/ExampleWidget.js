define([
	"delite/register",
	"delite/CssState",
	"delite/handlebars!./ExampleWidget/ExampleWidget.html",
	"delite/theme!./ExampleWidget/themes/{{theme}}/ExampleWidget.css",
	"requirejs-dplugins/has!bidi?delite/theme!./ExampleWidget/themes/{{theme}}/ExampleWidget_rtl.css"
], function (register, CssState, template) {

	return register("d-example", [HTMLElement, CssState], {
		// summary:
		//		Example widget for testing and as template for new widgets.

		template: template,

		baseClass: "d-example-widget"
	});
});