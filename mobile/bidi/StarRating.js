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
				var parent = this.domNode;
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

		_setZeroAreaWidthAttr: function(/*Number*/value){
			this.inherited(arguments);
			if(!this.isLeftToRight()){
				// Zero setting area is on the right side
				this.domNode.style.paddingLeft = "0px";
				this.domNode.style.paddingRight = this.zeroAreaWidth + "px";
			}
		},

		_updateStars: function(/*Number*/value, /*Boolean*/create){
			if(this.isLeftToRight()){
				return this.inherited(arguments);
			}else{
				var i, index;
				var parent;
				var left, h = this.imgNode.height, w = this.imgNode.width / this._nbOfSpriteIcons;
				for(i = 0; i < this.maximum; i++){
					index = (this.maximum - i - 1);
					if(index <= value - 1){
						left = 0; // full
					}else if(index >= value){
						left = w; // empty
					}else{
						left = w * 3; // half
					}
					if(create){
						parent = domConstruct.create("div", {
							style: {"float": "left"}
						}, this.domNode);
						iconUtils.createIcon(this.image,
							"0," + left + "," + w + "," + h, null, this.alt, parent, null, null);
					}else{
						parent = this.domNode.children[i];
						iconUtils.createIcon(this.image,
								"0," + left + "," + w + "," + h, parent.children[0], this.alt, parent, null, null);
					}
				}
			}
		}
	});
});