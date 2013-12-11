define([
	"dcl/dcl",
	"dojo/query",
	"./register",
	"./Widget",
	"./Container",
	"./Invalidating",
	"./LinearLayout",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/dom-geometry",
	"dojo/dom-class",
	"dojo/dom-construct",
	"./themes/load!./themes/{{theme}}/MultiColumns"],
	function(dcl, query, register, Widget, Container, Invalidating, LinearLayout, lang, dom, domGeom, domClass, domConstruct){
		return register("d-multi-columns", [HTMLElement, Widget, Container, Invalidating], {
			baseClass: "duiMultiColumns",
			_bl: null,
			preCreate: function () {
				this.addInvalidatingProperties("test");
			},

			refreshRendering: function(){
				if(this.direction == "horizontal"){
					domClass.add(this, "duiHLinearLayout");
					domClass.remove(this, "duiVLinearLayout");
				}else{
					domClass.add(this, "duiVLinearLayout");
					domClass.remove(this, "duiHLinearLayout");
				}
				console.log("refresh");

				query(".duiMultiColumns > .d-linear-layout > *").forEach(function(node, index, arr){
					domClass.add(node, "fill");
				});

			},
			buildRendering: function(){
				this._bl = new LinearLayout();
				while (this.children.length > 0){
					this._bl.addChild(this.children[0]);
				}
				domConstruct.place(this._bl, this);
				console.log("build", this.children);
				this.invalidateRendering();
			},
			addChild: dcl.superCall(function(sup){
				return function (/*dui/Widget|DOMNode*/ widget, /*int?*/ insertIndex) {
					sup.apply(this, arguments);

					console.log("added", widget);
				}})


		})
});

