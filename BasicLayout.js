define([
	"dcl/dcl",
	"./register",
	"./Widget",
	"./Container",
	"dojo/dom-class",
	"./themes/load!BasicLayout"],
	function(dcl, register, Widget, Container, domClass){
		var BasicLayout = dcl([Widget, Container], {

			baseClass: "mblBasicLayout",

			buildRendering: function(){
				if(this.getAttribute("direction") == "horizontal"){
					domClass.add(this, "mblHBasicLayout");
				}else{
					domClass.add(this, "mblVBasicLayout");
				}
			}
		});
		return register("d-basic-layout", [HTMLElement, BasicLayout]);
	})