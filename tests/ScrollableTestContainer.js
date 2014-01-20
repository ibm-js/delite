define([
	"delite/register",
	"delite/Widget",
	"delite/Container",
	"delite/Scrollable"
], function (register, Widget, Container, Scrollable) {

	// The purpose of this module is to provide a concrete widget using
	// the mixin delite/Scrollable in order to ease the testing of the mixin itself.
	
	return register("test-scrollable-container", 
		[HTMLElement, Widget, Container, Scrollable], {
		baseClass: "test-scrollable-container"
	});
});
