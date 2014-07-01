define([
	"delite/register",
	"delite/Widget"
], function (register, Widget) {
	return register("test-widget-2", [HTMLElement, Widget], {
		baseClass: "test-widget-2",
		strProp: "hello"
	});
});
