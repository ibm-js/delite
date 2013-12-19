define([
	"dojo/dom-class",
	"./register",
	"./Widget",
	"./DisplayContainer",
	"./Invalidating",
	"./themes/load!./themes/{{theme}}/LinearLayout"
], function (domClass, register, Widget, DisplayContainer, Invalidating) {
	return register("d-linear-layout", [HTMLElement, Widget, DisplayContainer, Invalidating], {

		// summary:
		//		A layout container based on CSS3 Flexible Box.
		// description:
		//		Child elements in a LinearLayout container can be laid out horizontally or vertically.
		//		A child can have a flexible width or height depending on orientation.
		//		To enable flexibility of a child, add the CSS class "fill" on it.
		//		This widget also provides two utility CSS classes: width100 and height100.
		//		These classes are useful for setting width or height to 100% easily.

		baseClass: "d-linear-layout",

		// vertical: Boolean
		//		Vertical/Horizontal layout
		vertical: true,

		preCreate: function () {
			this.addInvalidatingProperties("direction");
		},

		refreshRendering: function () {
			if (this.vertical) {
				domClass.add(this, "-delite-v-linear-layout");
				domClass.remove(this, "-delite-h-linear-layout");
			} else {
				domClass.add(this, "-delite-h-linear-layout");
				domClass.remove(this, "-delite-v-linear-layout");
			}
		},

		buildRendering: function () {
			this.invalidateRendering();
		}
	});
});