define([
	"dojo/_base/declare",
	"dojo/has",
	"dojo/dom-construct",
	"../iconUtils"
], function(declare, has, domConstruct, iconUtils){

	// module:
	//		dojox/mobile/bidi/StarRating

	return declare(null, {
		// summary:
		//		Bidi support for mobile StarRating widget.
		// description:
		//		Implementation for RTL and LTR direction support.
		//		This class should not be used directly.
		//		Mobile StarRating widget loads this module when user sets "has: {'dojo-bidi': true }" in data-dojo-config.

		/* internal properties */

		_nbOfSpriteIcons: 4,

		buildRendering: function(){
			this.inherited(arguments);
			// init the dir attribute when it has not been initialized by the dojo parser
			if(!this.dir){
				var parent = this.domNode.parentNode;
				while(parent){
					if(parent.dir){
						this.dir = parent.dir;
						parent = null;
					}else{
						parent = parent.parentNode;
					}
				}
			}
			if(this.dir){
				// support both "LTR" and "ltr"
				this.dir = this.dir.toLowerCase();
			}
			if(this.editable && !this.isLeftToRight()){
				// Zero setting area is on the right side
				this.domNode.style.paddingLeft = "0px";
				this.domNode.style.paddingRight = this.zeroAreaWidth + "px";
			}
		},

		_inZeroSettingArea: function(/*Number*/x, /*Number*/domNodeWidth){
			if(this.isLeftToRight()){
				return this.inherited(arguments);
			}else{
				return x > (domNodeWidth - this.zeroAreaWidth);
			}
		},

		_xToRawValue: function(/*Number*/x, /*Number*/domNodeWidth){
			var starStripLength = domNodeWidth - this.zeroAreaWidth;
			if(this.isLeftToRight()){
				return this.inherited(arguments);
			}else{
				return (starStripLength - x) / (starStripLength / this.maximum);
			}
		},

		_getStarIndex: function(/*Number*/updateLoopIndex){
			return (this.maximum - updateLoopIndex - 1);
		}
	});
});