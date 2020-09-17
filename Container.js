/** @module delite/Container */
define([
	"dcl/dcl",
	"./Widget"
], function (dcl, Widget) {

	/**
	 * Dispatched after an Element has been added as child of this widget.
	 * @example
	 * element.addEventListener("delite-add-child", function (evt) {
	 *      console.log("container: " + evt.target.id + " has new child " + evt.child.id);
	 * });
	 * @event module:delite/Container#delite-add-child
	 */

	/**
	 * Dispatched after an child Element has been removed from this widget.
	 * @example
	 * element.addEventListener("delite-remove-child", function (evt) {
	 *      console.log("container: " + evt.target.id + " removed child " + evt.child.id);
	 * });
	 * @event module:delite/Container#delite-remove-child
	 */

	/**
	 * Base class for widgets that contain content.
	 * Useful both for widgets that contain free-form markup (ex: ContentPane),
	 * and widgets that contain an ordered list of children (ex: Toolbar).
	 *
	 * Note that Container is not meant to be used for widgets that just internally create child
	 * widgets (ex: a StarRating widget creates stars), but rather for when the widget has children from
	 * the application's perspective (i.e. from the perspective of the widget *user* rather
	 * than the widget *author*).
	 *
	 * @mixin module:delite/Container
	 * @augments module:delite/Widget
	 */
	return dcl(Widget, /** @lends module:delite/Container# */{
		declaredClass: "delite/Container",

		/**
		 * Nodes to insert as children of this.containerNode, or if this.containerNode
		 * undefined, then as direct children of this widget.  Currently can only be
		 * passed as parameter to constructor.
		 * @member {Node[]}
		 */
		content: [],

		/**
		 * Designates where childNodes of the source DOM node will be placed,
		 * and also the target for nodes inserted via `.appendChild()`, `.insertBefore()`, etc.
		 * "Child nodes" in this case refers to both text, Elements and custom elements
		 * aka widgets.
		 *
		 * @member {Element}
		 * @default Widget root node itself.
		 * @protected
		 */
		containerNode: undefined,

		beforeInitializeRendering: function () {
			// Save original childNodes from markup, unless caller has specified child nodes programatically.
			if (this.content.length === 0) {
				this.content = this.getChildNodes();
			}
		},

		afterInitializeRendering: function () {
			if (!this.containerNode) {
				// All widgets with descendants must set containerNode.
				this.containerNode = this;
			}

			// Move or add child nodes into this.containerNode.  But don't disconnect/reconnect child nodes
			// unnecessarily as that triggers spurious calls to disconnectedCallback() and connectedCallback().
			this.content.forEach(function (child) {
				if (child.parentNode !== this.containerNode ) {
					if (child instanceof Text && !child.data) {
						// Avoid exception on IE (and also skip adding meaningless nodes).
						return;
					}
					this.containerNode.appendChild(child);
				}
			}, this);
		},

		appendChild: dcl.superCall(function (sup) {
			return function (child) {
				if (this.rendered) {
					var res = sup.call(this.containerNode, child);
					this.content = this.getChildNodes();
					this.onAddChild(child);
					return res;
				} else {
					return sup.call(this, child);
				}
			};
		}),

		insertBefore: dcl.superCall(function (sup) {
			return function (newChild, refChild) {
				if (this.rendered) {
					var res = sup.call(this.containerNode, newChild, refChild);
					this.content = this.getChildNodes();
					this.onAddChild(newChild);
					return res;
				} else {
					return sup.call(this, newChild, refChild);
				}
			};
		}),

		/**
		 * Callback whenever a child element is added to this widget via `appendChild()`, `insertBefore()`,
		 * or a method like `addChild()` that internally calls `appendChild()` and/or `insertBefore()`.
		 * @param {Element} node
		 */
		onAddChild: function (node) {
			this.emit("delite-add-child", {
				bubbles: false,
				cancelable: false,
				child: node
			});
		},

		/**
		 * Inserts the specified Element at the specified index.
		 * For example, `.addChild(node, 3)` sets this widget's fourth child to node.
		 * @param {Element} node - Element to add as a child.
		 * @param {number} [insertIndex] - Position the child as at the specified position relative to other children.
		 */
		addChild: function (node, insertIndex) {
			// Note: insertBefore(node, null) equivalent to appendChild().  Null arg is needed (only) on IE.
			var cn = this.containerNode || this, nextSibling = cn.children[insertIndex];
			cn.insertBefore(node, nextSibling || null);
			if (this.rendered) {
				this.content = this.getChildNodes();
			}
		},

		/**
		 * Detaches the specified element from this widget but does
		 * not destroy it.  You can also pass in an integer indicating
		 * the index within the container to remove (ie, removeChild(5) removes the sixth element).
		 * @param {Element|number} node
		 */
		removeChild: function (node) {
			if (typeof node === "number") {
				node = this.getChildren()[node];
			}

			if (node && node.parentNode) {
				HTMLElement.prototype.removeChild.call(node.parentNode, node); // detach but don't destroy
			}

			if (this.rendered) {
				this.content = this.getChildNodes();
			}

			this.emit("delite-remove-child", {
				bubbles: false,
				cancelable: false,
				child: node
			});
		},

		/**
		 * Returns all direct child elements of this widget, i.e. all widgets or element children of
		 * `this.containerNode`.  Note that it does not return all descendants, but rather just direct children.
		 *
		 * The result intentionally excludes elements outside of `this.containerNode`.  So, it is different than
		 * accessing the `children` property.
		 *
		 * @returns {Element[]}
		 */
		getChildren: function () {
			// transform the live HTMLCollection into an Array
			var cn = this.containerNode || this;
			return Array.from(cn.children);
		},

		/**
		 * Returns all direct child nodes of this widget, i.e. all children of `this.containerNode`, including text
		 * nodes.  Note that it does not return all descendants, but rather just direct children.
		 *
		 * The result intentionally excludes elements outside of `this.containerNode`.  So, it is different than
		 * accessing the `childNodes` property.
		 *
		 * @returns {Node[]}
		 */
		getChildNodes: function () {
			// transform the live HTMLCollection into an Array
			var cn = this.containerNode || this;
			return Array.from(cn.childNodes);
		},

		/**
		 * Returns true if widget has child elements, i.e. if `this.containerNode` contains Elements.
		 * @returns {boolean}
		 */
		hasChildren: function () {
			return this.getChildren().length > 0;
		},

		/**
		 * Returns the index of the child in this container or -1 if not found.
		 * @param {Element} child
		 * @returns {number}
		 */
		getIndexOfChild: function (child) {
			return this.getChildren().indexOf(child);
		},

		destroy: function () {
			this.content = null;
		}
	});
});
