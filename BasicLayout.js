define([
	"./register",
	"./Widget",
	"./Container",
	"./Invalidating",
	"dojo/dom-class",
	"./themes/load!BasicLayout"],
	function(register, Widget, Container, Invalidating, domClass){
		return register("d-basic-layout", [HTMLElement, Widget, Container, Invalidating], {

			baseClass: "duiBasicLayout",
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

	})