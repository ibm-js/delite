define([
	"dcl/dcl",
	"./register",
	"./Widget",
	"./Container",
	"./mixins/Invalidating",
	"dojo/dom-class",
	"./themes/load!BasicLayout"],
	function(dcl, register, Widget, Container, Invalidating, domClass){
		var BasicLayout = dcl([Widget, Container, Invalidating], {

			baseClass: "mblBasicLayout",
			direction: "horizontal",

			preCreate: function () {
				this.addInvalidatingProperties("direction");
			},

			refreshRendering: function(){
				if(this.direction == "horizontal"){
					domClass.add(this, "mblHBasicLayout");
					domClass.remove(this, "mblVBasicLayout");
				}else{
					domClass.add(this, "mblVBasicLayout");
					domClass.remove(this, "mblHBasicLayout");
				}
			},
			buildRendering: function(){
				this.invalidateRendering();
			}
		});
		return register("d-basic-layout", [HTMLElement, BasicLayout]);
	})