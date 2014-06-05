define([
	"delite/register",
	"delite/CssState",
	"delite/handlebars!./ExampleWidget/ExampleWidget.html",
	"delite/theme!./ExampleWidget/themes/{{theme}}/ExampleWidget_css",
	"dojo/has!bidi?delite/theme!./ExampleWidget/themes/{{theme}}/ExampleWidget_rtl_css"
], function (register, CssState, renderer) {

	return register("d-example", [HTMLElement, CssState], {
		// summary:
		//		Example widget for testing and as template for new widgets.

		buildRendering: renderer,

		baseClass: "d-example-widget"
	});
});