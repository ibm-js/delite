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
		/**
		 * Designates where children of the source DOM node will be placed,
		 * and also the target for nodes inserted via `.appendChild()`, `.insertBefore()`, etc.
		 * "Children" in this case refers to both DOM nodes and widgets.
		 *
		 * @member {Element}
		 * @default Widget root node itself.
		 * @protected
		 */
		containerNode: undefined,

		render: dcl.advise({
			before: function () {
				// Save original markup to put into this.containerNode.
				var srcDom = this._srcDom = this.ownerDocument.createDocumentFragment();
				var oldContainer = this.containerNode || this;
				while (oldContainer.firstChild) {
					srcDom.appendChild(oldContainer.firstChild);
				}
			},

			after: function () {
				if (!this.containerNode) {
					// All widgets with descendants must set containerNode.
					this.containerNode = this;
				}

				// Put original markup into this.containerNode.  Note that appendChild() on a DocumentFragment will
				// loop through all the Elements in the document fragment, adding each one.
				this.containerNode.appendChild(this._srcDom);
			}
		}),

		appendChild: dcl.superCall(function (sup) {
			return function (child) {
				if (this.rendered) {
					var res = sup.call(this.containerNode, child);
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
			// If I've been started but the child widget hasn't been started,
			// start it now.  Make sure to do this after widget has been
			// inserted into the DOM tree, so it can see that it's being controlled by me,
			// so it doesn't try to size itself.
			if (this.attached && node.attachedCallback) {
				node.attachedCallback();
			}

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
			var cn = this.containerNode, nextSibling = cn.children[insertIndex];
			cn.insertBefore(node, nextSibling || null);
		},

		/**
		 * Detaches the specified node instance from this widget but does
		 * not destroy it.  You can also pass in an integer indicating
		 * the index within the container to remove (ie, removeChild(5) removes the sixth node).
		 * @param {Element|number} node
		 */
		removeChild: function (node) {
			if (typeof node === "number") {
				node = this.getChildren()[node];
			}

			if (node && node.parentNode) {
				HTMLElement.prototype.removeChild.call(node.parentNode, node); // detach but don't destroy
			}

			this.emit("delite-remove-child", {
				bubbles: false,
				cancelable: false,
				child: node
			});
		},

		/**
		 * Returns all direct children of this widget, i.e. all widgets or DOM nodes underneath
		 * `this.containerNode`.  Note that it does not return all
		 * descendants, but rather just direct children.
		 *
		 * The result intentionally excludes element outside off `this.containerNode`.  So, it is different than
		 * accessing the `children` or `childNode` properties.
		 *
		 * @returns {Element[]}
		 */
		getChildren: function () {
			// use Array.prototype.slice to transform the live HTMLCollection into an Array
			return Array.prototype.slice.call(this.containerNode.children);
		},

		/**
		 * Returns true if widget has child nodes, i.e. if `this.containerNode` contains widgets.
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
		}
	});
});
