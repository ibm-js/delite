define([
	"./register",
	"./Widget",
	"./DisplayContainer",
	"./Invalidating",
	"dojo/dom-class",
	"./themes/load!./themes/{{theme}}/LinearLayout"
], function (register, Widget, DisplayContainer, Invalidating, domClass) {
	return register("d-linear-layout", [HTMLElement, Widget, DisplayContainer, Invalidating], {

		baseClass: "duiLinearLayout",
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