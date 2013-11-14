define([
	"./register",
	"./Widget",
	"./Container",
	"dojo/dom-class",
	"./themes/load!BasicLayout"],
	function(register, Widget, Container, domClass){
		return register("dui-basic-layout", [HTMLDivElement, Widget, Container], {
			baseClass: "mblBasicLayout",
			direction: "horizontal",
			buildRendering: function(){
				debugger;
				if(this.direction == "horizontal"){
					domClass.add(this, "mblHBasicLayout");
				}else{
					domClass.add(this, "mblVBasicLayout");
				}
			}
		});
	}
)