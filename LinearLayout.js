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
				domClass.add(this, "duiVLinearLayout");
				domClass.remove(this, "duiHLinearLayout");
			} else {
				domClass.add(this, "duiHLinearLayout");
				domClass.remove(this, "duiVLinearLayout");
			}
		},

		buildRendering: function () {
			this.invalidateRendering();
		}
	});
});