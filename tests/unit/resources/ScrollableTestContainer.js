define([
	"delite/register",
	"delite/Container",
	"delite/Scrollable"
], function (register, Container, Scrollable) {

	// The purpose of this module is to provide a concrete widget using
	// the mixin delite/Scrollable in order to ease the testing of the mixin itself.

	return register("test-scrollable-container", [HTMLElement, Container, Scrollable], {
		baseClass: "test-scrollable-container"
	});
});
