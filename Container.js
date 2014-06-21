/** @module delite/Container */
define([
	"dcl/dcl",
	"./Widget"
], function (dcl, Widget) {

	/**
	 * Widget that contains a set of Element children (either widgets or plain DOM nodes).
	 * @mixin module:delite/Container
	 * @augments module:delite/Widget
	 */
	return dcl(Widget, /** @lends module:delite/Container# */{
		buildRendering: dcl.after(function () {
			if (!this.containerNode) {
				// All widgets with descendants must set containerNode.
				this.containerNode = this;
			}
		}),

		/**
		 * Inserts specified Element as a child of this widget's
		 * container node, and possibly does other processing (such as layout).
		 * @param {Element} node - Element to add as a child.
		 * @param {number} [insertIndex] - Position the child as at the specified position relative to other children.
		 */
		addChild: function (node, insertIndex) {
			// Note: insertBefore(node, null) equivalent to appendChild().  Null arg is needed (only) on IE.
			var cn = this.containerNode, nextSibling = cn.children[insertIndex];
			cn.insertBefore(node, nextSibling || null);

			// If I've been started but the child widget hasn't been started,
			// start it now.  Make sure to do this after widget has been
			// inserted into the DOM tree, so it can see that it's being controlled by me,
			// so it doesn't try to size itself.
			if (this._started && !node._started && dcl.isInstanceOf(node, Widget)) {
				node.startup();
			}
		},

		/**
		 * Removes the passed node instance from this widget but does
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
		},

		/**
		 * Returns true if widget has child widgets, i.e. if this.containerNode contains widgets.
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
