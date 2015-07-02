/** @module delite/Dialog */
define([
	"dcl/dcl",
	"./a11y",
	"./Widget"
], function (dcl, a11y, Widget) {
	/**
	 * Base class for modal dialogs, where tabbing from the last element loops to the first, and vice-versa.
	 * @mixin module:delite/Dialog
	 * @augments module:delite/Widget
	 */
	return dcl(Widget, /** @lends module:delite/Dialog# */ {
		createdCallback: function () {
			this.on("keydown", this._dialogKeyDownHandler.bind(this));
		},

		_getFocusItems: function () {
			// summary:
			//		Finds focusable items in dialog,
			//		and sets this._firstFocusItem and this._lastFocusItem
			// tags:
			//		protected

			var elems = a11y._getTabNavigable(this.containerNode);
			this._firstFocusItem = elems.lowest || elems.first || this.closeButtonNode || this.domNode;
			this._lastFocusItem = elems.last || elems.highest || this._firstFocusItem;
		},

		_dialogKeyDownHandler: function (/*Event*/ evt) {
			if (evt.key === "Tab") {
				this._getFocusItems(this.domNode);
				var node = evt.target;
				if (this._firstFocusItem === this._lastFocusItem) {
					// don't move focus anywhere, but don't allow browser to move focus off of dialog either
					evt.stopPropagation();
					evt.preventDefault();
				} else if (node === this._firstFocusItem && evt.shiftKey) {
					// if we are shift-tabbing from first focusable item in dialog, send focus to last item
					this._lastFocusItem.focus();
					evt.stopPropagation();
					evt.preventDefault();
				} else if (node === this._lastFocusItem && !evt.shiftKey) {
					// if we are tabbing from last focusable item in dialog, send focus to first item
					this._firstFocusItem.focus();
					evt.stopPropagation();
					evt.preventDefault();
				}
			}
		}
	});
});
