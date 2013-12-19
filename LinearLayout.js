define([
	"dojo/dom-class",
	"./register",
	"./Widget",
	"./DisplayContainer",
	"./Invalidating",
	"./themes/load!./themes/{{theme}}/LinearLayout"
], function (domClass, register, Widget, DisplayContainer, Invalidating) {
	return register("d-linear-layout", [HTMLElement, Widget, DisplayContainer, Invalidating], {

		baseClass: "d-linear-layout",
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