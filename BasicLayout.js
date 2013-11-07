define([
	"./register",
	"./Widget",
	"./mixins/Invalidating",
	"dojo/dom-class",
	"./themes/load!BasicLayout"],
	function(register, Widget, Invalidating, domClass){
		return register("dui-basic-layout", [HTMLDivElement, Widget, Invalidating], {
			baseClass: "mblBasicLayout",
			direction: "horizontal",
			buildRendering: function(){
if(this.direction == "horizontal"){
					domClass.add(this, "mblHBasicLayout");
				}else{
					domClass.add(this, "mblVBasicLayout");
				}
			}
		});
	}
)