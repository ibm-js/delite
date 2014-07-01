define([
	"delite/register",
	"delite/Widget"
], function (register, Widget) {
	return register("test-widget-1", [HTMLElement, Widget], {
		baseClass: "test-widget-1",
		strProp: "hello"
	});
});
