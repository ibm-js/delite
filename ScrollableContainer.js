define([
	"./register",
	"./Widget",
	"./Container",
	"./Scrollable",
	"./themes/load!./themes/{{theme}}/ScrollableContainer"
], function (register, Widget, Container, Scrollable) {

	// module:
	//		dui/ScrollableContainer
	
	return register("d-scrollable-container", [HTMLElement, Widget, Container, Scrollable], {
		// summary:
		//		A container widget with scrolling capabilities.
		// description:
		//		A container widget which can scroll its content 
		//		horizontally and/or vertically. TODO: IMPROVEME.

		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "d-scrollable-container"
	});
});
