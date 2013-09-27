define([
	"dojo/_base/declare",
	"dojo/dom",
	"dojo/dom-style",
	"dui/mobile/Container",
	"./themes/load!ScrollableContainer"
], function(declare, dom, domStyle, Container){

	// module:
	//		dui/ScrollableContainer

	return declare("dui.ScrollableContainer", [Container], {
		// summary:
		//		A container widget with scrolling capabilities.
		// description:
		//		Container is a container widget which can scroll its content.

		// scrollDir: String
		//		v: vertical, h: horizontal, vh: both, f: flip
		scrollDir: "v",
		
		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "duiScrollableContainer",
		
		buildRendering: function(){
			this.inherited(arguments);

			dom.setSelectable(this.containerNode, false);
			
			if(this.scrollDir.indexOf("v") != -1){ 
				domStyle.set(this.domNode, "overflowY", "scroll"); // or "auto"... 
			} 
			if(this.scrollDir.indexOf("h") != -1 || 
				this.scrollDir.indexOf("f") != -1){ 
				domStyle.set(this.domNode, "overflowX", "scroll"); // or "auto"... 
			} 
		}
	});
});
