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
		declaredClass: "delite/Dialog",

		/**
		 * Whether or not dialog is modal.
		 */
		modal: true,

		constructor: function () {
			this.on("keydown", this._dialogKeyDownHandler.bind(this));
		},

		focus: function () {
			// Focus on first field.
			this._getFocusItems();
			if (this._firstFocusItem && this._firstFocusItem !== this) {
				this._firstFocusItem.focus();
			}
		},

		/**
		 * Finds focusable items in dialog,
		 * and sets `this._firstFocusItem` and `this._lastFocusItem`.
		 *
		 * @protected
		 */
		_getFocusItems: function () {
			var elems = a11y.getTabNavigable(this);
			this._firstFocusItem = elems[0] || this.closeButtonNode || this;
			this._lastFocusItem = elems[elems.length - 1] || this._firstFocusItem;
		},

		_dialogKeyDownHandler: function (/*Event*/ evt) {
			if (this.modal && evt.key === "Tab") {
				this._getFocusItems(this);
				var node = evt.target;
				if (this._firstFocusItem === this._lastFocusItem) {
					// don't move focus anywhere, but don't allow browser to move focus off of dialog either
					evt.preventDefault();
				} else if (node === this._firstFocusItem && evt.shiftKey) {
					// if we are shift-tabbing from first focusable item in dialog, send focus to last item
					this._lastFocusItem.focus();
					evt.preventDefault();
				} else if (node === this._lastFocusItem && !evt.shiftKey) {
					// if we are tabbing from last focusable item in dialog, send focus to first item
					this._firstFocusItem.focus();
					evt.preventDefault();
				}

				// Call stopImmediatePropagation() so the popup.js doesn't see the TAB and close the Dialog.
				evt.stopImmediatePropagation();
			}
		}
	});
});
