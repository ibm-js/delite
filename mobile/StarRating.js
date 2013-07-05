define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/sniff",
	"dojo/on",
	"dojo/string",
	"dojo/touch",
	"dojo/dom-construct",
	"dojo/dom-geometry",
	"dijit/_WidgetBase",
	"./iconUtils",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/StarRating"
], function(declare, lang, has, on, string, touch, domConstruct, domGeometry, WidgetBase, iconUtils, BidiStarRating){

	// module:
	//		dojox/mobile/StarRating

	var StarRating = declare(WidgetBase, {
		// summary:
		//		A widget that displays a rating, usually with stars, and that allows setting a different rating value
		//		by touching the stars.
		// description:
		//		This widget shows the rating using an image sprite that contains full stars, half stars and empty stars
		//		(note that because this widget is using your own set of star icons, they do not have to be stars at all).
		//		The widget can be used in read-only or in editable mode. In editable mode, the widget allows to set the
		//		rating to 0 stars or not using the zeroAreaWidth property. In this mode, it also allows to set
		//		half values or not using the editHalfValues property.
		//		This widget supports right to left direction (using the HTML dir property on the widget dom node or a parent node).
		//		In desktop browser, the widget displays a tooltip that read the current rating. The tooltip text can be customized
		//		using the tooltipText property. 


		// image: String
		//		Path to a star image, which includes three stars if bidi support is not enabled (full star,
		//		empty star, and half star, from left to right), or four stars if bidi support is enabled (full star,
		//		empty star, left-to-right half star, right-to-left half star, from left to right). All stars must
		//		have the same width.
		image: "",

		// maximum: Number
		//		The maximum rating, that is also the number of stars to show.
		maximum: 5,

		// value: Number
		//		The current value of the Rating.
		value: 0,

		// alt: String
		//		An alternate text for the icon image.
		alt: "",

		// editable: Boolean
		//		Is the user allowed to edit the value of the Rating by touching / clicking the stars ?
		editable: false,

		// editHalfValues: Boolean
		//		If the Rating is editable, is the user allowed to edit half values (0.5, 1.5, ...) or not ?
		editHalfValues: false,

		// zeroAreaWidth: Number
		//		The number of pixel to add to the left of the widget (or right if the direction is rtl) to allow setting the value to 0.
		//		The pixels are only added if the widget is editable.
		//		Set this value to 0 to forbid the user from setting the value to zero during edition.
		zeroAreaWidth: 20,

		// tooltipText: String
		//		On desktop browsers, a tooltip displays the value of the current rating (attribute title of the dom node). This parameter
		//		allows you to set the message displayed by the tooltip. In the tooltip text, the substring ${value} is replaced by the actual
		//		value of the Rating widget, while ${maximum} is replaced by the value of maximum.
		tooltipText: "${value}",

		/* internal properties */

		_eventsHandlers: [],
		_nbOfSpriteIcons: 3,
		_x: null, // x position of the widget
		_w: null, // width of the widget

		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "mblRating",

		constructor: function(){
			if(this.zeroAreaWidth < 0){
				this.zeroAreaWidth = 0;
			}
		},

		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.style.display = "inline-block";
			if(this.editable){
				this.domNode.style.paddingLeft = this.zeroAreaWidth + "px";
			}
			var img = this.imgNode = domConstruct.create("img");
			on(img, "load",
				lang.hitch(this, function(){
					var value = this.value;
					this.value = null; // so that watch callbacks are called the first time the value is set !
					this.set("value", value);
					if(this.editable){
						this.on(touch.press, lang.hitch(this, this._onTouchStart));
					}
				}));
			iconUtils.createIcon(this.image, null, img);
		},

		_registerEventsHandler: function(/*Array*/events, /*Function*/handler){
			var i;
			for(i=0; i < events.length; i++){
				this._eventsHandlers.push(this.on(events[i], lang.hitch(this, handler)));
			}
		},

		_removeEventsHandlers: function(){
			while(this._eventsHandlers.length){
				this._eventsHandlers.pop().remove();
			}
		},

		_onTouchStart: function(/*Event*/ event){
			event.preventDefault();
			if(!this._eventsHandlers.length){
				// handle move on the stars strip
				this._registerEventsHandler([touch.move], this._onTouchMove);
				// handle the end of the value editing
				this._registerEventsHandler([touch.release,
				                             touch.cancel], this._onTouchEnd);
				if(!has('touch')){ // needed only on desktop, for the case when the mouse cursor leave the widget and mouseup is thrown outside of it
					this._registerEventsHandler([touch.leave], this._onTouchEnd);
				}
			}else{
				// Remove event handlers (stopping the rating process)
				this._removeEventsHandlers();
			}
		},

		_onTouchMove: function(/*Event*/ event){
			this._setValueAttr(this._coordToValue(event));
		},

		_onTouchEnd: function(/*Event*/ event){
			this._setValueAttr(this._coordToValue(event));
			// Remove event handlers
			this._removeEventsHandlers();
		},

		_coordToValue: function(/*Event*/event){
			var box = domGeometry.position(this.domNode, false);
			var xValue = event.clientX - box.x;
			var rawValue = null, discreteValue;
			// fix off values observed on leave event
			if(xValue < 0){
				xValue = 0;
			}else if(xValue > box.w){
				xValue = box.w;
			}
			if(this._inZeroSettingArea(xValue, box.w)){
				return 0;
			}else{
				rawValue = this._xToRawValue(xValue, box.w);
			}
			if(rawValue != null){
				if(rawValue == 0){
					rawValue = 0.1; // do not allow setting the value to 0 when clicking on a star
				}
				discreteValue = Math.ceil(rawValue);
				if(this.editHalfValues && (discreteValue - rawValue) > 0.5){
					discreteValue -= 0.5;
				}
				return discreteValue;
			}
		},

		_inZeroSettingArea: function(/*Number*/x, /*Number*/domNodeWidth){
			return x < this.zeroAreaWidth;
		},

		_xToRawValue: function(/*Number*/x, /*Number*/domNodeWidth){
			var starStripLength = domNodeWidth - this.zeroAreaWidth;
			return (x - this.zeroAreaWidth) / (starStripLength / this.maximum);
		},

		_setValueAttr: function(/*Number*/value){
			// summary:
			//		Sets the value of the Rating.
			// tags:
			//		private
			var createChildren = this.domNode.children.length != this.maximum;
			this._set("value", value);
			if(typeof value == 'number' && this.tooltipText && typeof this.tooltipText === 'string'){
				// TODO: restrict the number of digits displayed for the value in the tooltip in IE
				this.domNode.title = string.substitute(this.tooltipText, {value: this.value.toLocaleString(), maximum: this.maximum});
			}
			if(this.imgNode.height == 0){ return; } // loading of image has not been completed yet
			if(createChildren){
				domConstruct.empty(this.domNode);
			}
			this._updateStars(value, createChildren);
		},

		_updateStars: function(/*Number*/value, /*Boolean*/create){
			var i;
			var parent;
			var left, h = this.imgNode.height, w = this.imgNode.width / this._nbOfSpriteIcons;
			for(i = 0; i < this.maximum; i++){
				if(i <= value - 1){
					left = 0; // full
				}else if(i >= value){
					left = w; // empty
				}else{
					left = w * 2; // half
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
	});

	return has('dojo-bidi') ? declare([StarRating, BidiStarRating]) : StarRating;
});