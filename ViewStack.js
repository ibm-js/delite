define(
	["dcl/dcl",
		"./register",
		"dojo/sniff",
		"./Widget",
		"./Container",
		"./Invalidating",
		"dojo/_base/lang",
		"dojo/dom",
		"dojo/dom-geometry",
		"dojo/dom-class",
		"./themes/load!./themes/{{theme}}/ViewStack",
		"./themes/load!./themes/common/transitions/slide",
		"./themes/load!./themes/common/transitions/reveal",
		"./themes/load!./themes/common/transitions/flip",
		"./themes/load!./themes/common/transitions/revealv",
		"./themes/load!./themes/common/transitions/scaleIn"],
	function (dcl, register, sniff, Widget, Container, Invalidating, lang, dom, domGeom, domClass) {
		return register("d-view-stack", [HTMLElement, Widget, Container, Invalidating], {

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
			//	|	<d-view-stack id="vs">
			//	|		<div id="childA">...</div>
			//	|		<div id="childB">...</div>
			//	|		<div id="childC">...</div>
			//	|	</d-view-stack>
			//	|	<d-button onclick="vs.show(childB, {transition: 'reveal', reverse: true})">...</d-button>

			baseClass: "duiViewStack",

			transition: "slide",

			reverse: false,

			transitionTiming: {default: 0, ios: 20, android: 100, mozilla: 100},

			_timing: 0,

			preCreate: function () {
				this.addInvalidatingProperties("transitionTiming");
			},
			buildRendering: function () {
				for (var i = 1; i < this.children.length; i++) {
					this._setVisibility(this.children[i], false);
				}
				this.invalidateRendering();
			},

			refreshRendering: function () {
				for (var o in this.transitionTiming){
				    if (sniff(o) && this._timing < this.transitionTiming[o]){
						this._timing = this.transitionTiming[o];
					}
				}
			},

			showNext: function (props) {
				if (!this._visibleChild && this.children.length > 0) {
					this._visibleChild = this.children[0];
				}
				if (this._visibleChild && this._visibleChild.getNextSibling) {
					this.show(this._visibleChild.getNextSibling(), props);
				} else {
					console.log("ViewStack's children must implement getNextSibling()");
				}
			},

			showPrevious: function (props) {
				if (!this._visibleChild && this.children.length > 0) {
					this._visibleChild = this.children[0];
				}
				if (this._visibleChild && this._visibleChild.getPreviousSibling) {
					this.show(this._visibleChild.getPreviousSibling(), props);
				} else {
					console.log("ViewStack's children must implement getPreviousSibling()");
				}
			},

			show: function (/* HTMLDivElement */ node, props) {
				//		Shows a children of the ViewStack. The parameter 'props' is optional and is
				//		{transition: 'slide', reverse: false} by default.
				if (!this._visibleChild) {
					this._visibleChild = this.children[0];
				}
				var origin = this._visibleChild;
				if (origin) {

					if (node && origin !== node) {
						if (!props) {
							props = {transition: this.transition, reverse: this.reverse};
						}
						if (!props.transition) {
							props.transition = this.transition;
						}
						this._setVisibility(node, true);
						this._setAfterTransitionHandlers(origin, props);
						this._setAfterTransitionHandlers(node, props);
						domClass.add(origin, this._transitionClass(props.transition));
						domClass.add(node, this._transitionClass(props.transition));
						domClass.remove(node, "duiTransition");
						domClass.add(node, "duiIn");
						if (props.reverse === true) {
							domClass.add(origin, "duiReverse");
							domClass.add(node, "duiReverse");
						}
//
						this.defer(function () {
							domClass.add(node, "duiTransition");
							domClass.add(origin, "duiTransition");
							domClass.add(origin, "duiOut");
							if (props.reverse === true) {
								domClass.add(origin, "duiReverse");
								domClass.add(node, "duiReverse");
							}
							domClass.add(node, "duiIn");

						}, this._timing);
						this._visibleChild = node;
					}
				}
			},

			addChild: dcl.superCall(function (sup) {
				return function (/*dui/Widget|DOMNode*/ widget, /*jshint unused: vars */insertIndex) {
					sup.apply(this, arguments);
					this._setVisibility(widget, false);
				};
			}),

			_visibleChild: null,

			_transitionEndHandlers: [],

			_setAfterTransitionHandlers: function (node, props) {

				var handle = lang.hitch(this, this._afterTransitionHandle);
				this._transitionEndHandlers.push({node: node, handle: handle, props: props});
				node.addEventListener("webkitTransitionEnd", handle);
				node.addEventListener("transitionend", handle); // IE10 + FF

			},

			_setVisibility: function (node, val) {
				if (val) {
					node.style.visibility = "visible";
					node.style.display = "";
				} else {
					node.style.visibility = "hidden";
					node.style.display = "none";
				}
			},

			_transitionClass: function (s) {
				return "dui" + s.charAt(0).toUpperCase() + s.substring(1);
			},

			_afterTransitionHandle: function (event) {
				var item;
				for (var i = 0; i < this._transitionEndHandlers.length; i++) {
					item = this._transitionEndHandlers[i];
					if (event.target === item.node) {
						if (domClass.contains(item.node, "duiOut")) {
							this._setVisibility(item.node, false);
						}
						domClass.remove(item.node, "duiIn");
						domClass.remove(item.node, "duiOut");
						domClass.remove(item.node, "duiReverse");
						domClass.remove(item.node, this._transitionClass(item.props.transition));
						domClass.remove(item.node, "duiTransition");
						item.node.removeEventListener("webkitTransitionEnd", item.handle);
						item.node.removeEventListener("transitionend", item.handle);
						this._transitionEndHandlers.splice(i, 1);
						break;
					}
				}
			}
		});
	});

