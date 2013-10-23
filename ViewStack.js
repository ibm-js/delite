define([
	"./register",
	"./_WidgetBase",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/dom-geometry",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dijit/registry"


], function(register, _WidgetBase, lang, dom, domGeom, domClass, domConstruct, registry){

	return register("dui-view-stack", [HTMLDivElement, _WidgetBase], {
		// summary:
		//		ViewStack container widget.
		//
		//		ViewStack displays its first child node by default.
		//		The methods 'show' is used to change the visible child.
		//
		//		Styling constrains: the following CSS attributes must not be changed.
		// 			- ViewStack node:  position, box-sizing, overflow-x
		// 			- ViewStack children:  position, box-sizing, width, height
		//		See ViewStack.css for default values.

		// example:
		//	|	<div is="dui/ViewStack" id="vs">
		//	|		<div id="childA">...</div>
		//	|		<div id="childB">...</div>
		//	|		<div id="childC">...</div>
		//	|	</div>
		//	|	<button is="dui-button" onclick="vs.show(childB, {transition: 'slide', direction: 'start'})">...</div>

		baseClass: "duiViewStack",

		// TODO: Is this method really useful ?
		showNext: function(props){
			if(!this._visibleChild && this.children.length > 0){
				this._visibleChild = this.children[0];
			}
			if(this._visibleChild && this._visibleChild.getNextSibling){
				this.show(this._visibleChild.getNextSibling(), props);
			}else{
				console.log("ViewStack's children must implement getNextSibling()");
			}
		},

		// TODO: Is this method really useful ?
		showPrevious: function(props){
			if(!this._visibleChild && this.children.length > 0){
				this._visibleChild = this.children[0];
			}
			if(this._visibleChild && this._visibleChild.getPreviousSibling){
				this.show(this._visibleChild.getPreviousSibling(), props);
			}else{
				console.log("ViewStack's children must implement getPreviousSibling()");
			}
		},

		show: function(/* HTMLDivElement */ node, props){
			//		Shows a children of the ViewStack. The parameter 'props' is optional and is
			//		{transition:'slide', direction:'end'} by default.

			if(!this._visibleChild){
				this._visibleChild = this.children[0];
			}
			var origin = this._visibleChild;
			if(origin){

				if(node && origin != node){
					if (!props){
						props = {transition: "slide", direction: "end"};
					}
					if(!props.transition || props.transition == "slide"){
						this._setVisibility(node, true);

						this._setAfterTransitionHandlers(origin);
						this._setAfterTransitionHandlers(node);

						this._disableAnimation(node);
						props.direction == "start" ? this._leftTranslated(node) : this._rightTranslated(node);

						setTimeout(lang.hitch(this, function(){
							this._enableAnimation(node);
							this._enableAnimation(origin);
							props.direction == "start" ? this._rightTranslated(origin) : this._leftTranslated(origin);
							this._notTranslated(node);

						}),0);
						this._visibleChild = node;

					}
				}
			}
		},

		// TODO: Rely on _Container.addChild
		addChild: function(/* HTMLDivElement */ node){
			if(node){
				domConstruct.place(node, this);
				this._setVisibility(node, false);
			}
		},

		// TODO: Rely on _Container.removeChild
		removeChild: function(/* HTMLDivElement */ node){
			if(node){
				domConstruct.destroy(node);
			}
		},

		buildRendering: function(){
			for(var i=1; i < this.children.length; i++){
				this._setVisibility(this.children[i], false);
			}
		},

		_visibleChild: null,

		_enableAnimation: function (node){
			domClass.add(node, "mblSlideAnim");
		},

		_disableAnimation: function (node){
			domClass.remove(node, "mblSlideAnim");
		},

		_notTranslated: function(node){
			domClass.add(node, "notTranslated");
			domClass.remove(node, "leftTranslated");
			domClass.remove(node, "rightTranslated");
		},

		_leftTranslated: function(node){
			domClass.add(node, "leftTranslated");
			domClass.remove(node, "notTranslated");
			domClass.remove(node, "rightTranslated");
		},

		_rightTranslated: function(node){
			domClass.add(node, "rightTranslated");
			domClass.remove(node, "notTranslated");
			domClass.remove(node, "leftTranslated");
		},

		_setAfterTransitionHandlers: function(node){
			node.addEventListener("webkitTransitionEnd", lang.hitch(this,this._afterTransitionHandle));
			node.addEventListener("transitionend", lang.hitch(this,this._afterTransitionHandle)); // IE10 + FF
		},

		_removeAfterTransitionHandlers: function(node){
			node.removeEventListener("webkitTransitionEnd", lang.hitch(this,this._afterTransitionHandle));
			node.removeEventListener("transitionend", lang.hitch(this,this._afterTransitionHandle)); // IE10 + FF
		},


		_setVisibility: function(node, val){
			node.style.visibility = val ? "visible" : "hidden";
			node.style.display = val ? "" : "none";
		},

		_afterTransitionHandle: function(event){
			var node = event.target;

			// ##########################
			// OPTIMISATION: let translated element in place after transition
			// For next transitions, if the element is already at the correct place, we avoid an extra rendering pass.
			// TODO: Check compatibility with all actual devices
			//if(domClass.contains(node, "leftTranslated") || domClass.contains(node, "rightTranslated")){
			//	this._setVisibility(node, false);
			//}
			//domClass.remove(node, "rightTranslated");
			//domClass.remove(node, "leftTranslated");
			//domClass.remove(node, "notTranslated");
			// ##########################
			domClass.remove(node, "mblSlideAnim");
			this._removeAfterTransitionHandlers(node);
		}
	});
});

