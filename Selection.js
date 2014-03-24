define(["dcl/dcl", "dojo/sniff", "./Widget"], function (dcl, has, Widget) {
	return dcl(Widget, {
		// summary:
		//		Mixin for classes for widgets that manage a list of selected data items.

		preCreate: function () {
			this._set("selectedItems", []);
		},

		// selectionMode: String
		//		Valid values are:
		//
		//		1. "none": No selection can be done.
		//		2. "single": Only one item can be selected at a time.
		//		3. "multiple": Several item can be selected using the control key modifier.
		//		Changing this value impacts the current selected items to adapt the selection to the new mode. However
		//		whatever the selection mode is you can always set several selected items usign the selectItem(s) API.
		//		The mode will be enforced only when using setSelected and/or selectFromEvent APIs.
		//		Default value is "single".
		selectionMode: "single",

		_setSelectionModeAttr: function (value) {
			if (value !== "none" && value !== "single" && value !== "multiple") {
				throw new TypeError("selectionMode invalid value");
			}
			if (value !== this.selectionMode) {
				this._set("selectionMode", value);
				if (value === "none") {
					this.selectedItems = null;
				} else if (value === "single" && this.selectedItem) {
					this.selectedItems = [this.selectedItem];
				}
			}
		},

		// selectedItem: Object
		//		In single selection mode, the selected item or in multiple selection mode the last selected item.
		selectedItem: null,

		_setSelectedItemAttr: function (value) {
			if (this.selectedItem !== value) {
				this._set("selectedItem", value);
				this.selectedItems = (value == null ? null : [value]);
			}
		},

		// selectedItems: Object[]
		//		The list of selected items.
		selectedItems: null,

		_setSelectedItemsAttr: function (value) {
			var oldSelectedItems = this.selectedItems;

			this._set("selectedItems", value);
			this._set("selectedItem", null);

			if (oldSelectedItems != null && oldSelectedItems.length > 0) {
				this.updateRenderers(oldSelectedItems, true);
			}
			if (this.selectedItems && this.selectedItems.length > 0) {
				this._set("selectedItem", this.selectedItems[0]);
				this.updateRenderers(this.selectedItems, true);
			}
		},

		_getSelectedItemsAttr: function () {
			return this._get("selectedItems") == null ? [] : this._get("selectedItems").concat();
		},

		hasSelectionModifier: function (event) {
			// summary:
			//		Tests if an event has a selection modifier. If it has a selection modifier, that means that:
			//			* if selectionMode is "single", the event will be able to deselect a selected item
			//			* if selectionMode is "multiple", the event will trigger the selection state of the item
			//		The default implementation of this method returns true if the event.ctrlKey attribute is
			//		true, which means that:
			//			* if selectionMode is "single", the Ctrl (or Command on MacOS) key must be pressed for the
			//			event to deselect the currently selected item
			//			* if selectionMode is "multiple", the Ctrl (or Command on MacOS) key must be pressed for the
			//			event to toggle the selection status of the item.
			return !has("mac") ? event.ctrlKey : event.metaKey;
		},

		isSelected: function (item) {
			// summary:
			//		Returns whether an item is selected or not.
			// item: Object
			//		The item to test the selection for.			
			if (this.selectedItems == null || this.selectedItems.length === 0) {
				return false;
			}
			var identity = this.getIdentity(item);
			return this.selectedItems.some(function (sitem) {
				return this.getIdentity(sitem) === identity;
			}, this);
		},

		getIdentity: function (/*jshint unused: vars */item) {
			// summary:
			//		This function must be implemented to return the id of a item.
			// item: Object
			//		The item to query the identity for.
		},

		setSelected: function (item, value) {
			// summary:
			//		Change the selection state of an item.
			// item: Object
			//		The item to change the selection state for.
			// value: Boolean
			//		True to select the item, false to deselect it. 

			if (this.selectionMode === "none" || item == null) {
				return;
			}

			this._setSelected(item, value);
		},

		_setSelected: function (item, value) {
			// copy is returned
			var sel = this.selectedItems, res, identity;

			if (this.selectionMode === "single") {
				if (value) {
					this.selectedItem = item;
				} else if (this.isSelected(item)) {
					this.selectedItems = null;
				}
			} else { // multiple
				if (value) {
					if (this.isSelected(item)) {
						return; // already selected
					}
					if (sel == null) {
						sel = [item];
					} else {
						sel.unshift(item);
					}
					this.selectedItems = sel;
				} else {
					identity = this.getIdentity(item);
					res = sel ? sel.filter(function (sitem) {
						return this.getIdentity(sitem) !== identity;
					}, this) : [];
					if (res == null || res.length === sel.length) {
						return; // already not selected
					}
					this.selectedItems = res;
				}
			}
		},

		selectFromEvent: function (event, item, renderer, dispatch) {
			// summary:
			//		Applies selection triggered by an user interaction
			// e: Event
			//		The source event of the user interaction.
			// item: Object
			//		The render item that has been selected/deselected.
			// renderer: Object
			//		The visual renderer of the selected/deselected item.			
			// dispatch: Boolean
			//		Whether an event must be dispatched or not.
			// returns: Boolean
			//		Returns true if the selection has changed and false otherwise.
			// tags:
			//		protected

			if (this.selectionMode === "none") {
				return false;
			}

			return this._selectFromEvent(event, item, renderer, dispatch);
		},

		_selectFromEvent: function (event, item, renderer, dispatch) {
			var changed;
			var oldSelectedItem = this.selectedItem;
			var selected = item == null ? false : this.isSelected(item);

			if (item == null) {
				if ((this.selectionMode === "multiple" && !this.hasSelectionModifier(event))
					&& this.selectedItem != null) {
					this.selectedItem = null;
					changed = true;
				}
			} else if (this.selectionMode === "multiple") {
				if (this.hasSelectionModifier(event)) {
					this.setSelected(item, !selected);
					changed = true;
				} else {
					this.selectedItem = item;
					changed = true;
				}
			} else { // single
				if (this.hasSelectionModifier(event)) {
					//if the object is selected deselects it.
					this.selectedItem = (selected ? null : item);
					changed = true;
				} else {
					if (!selected) {
						this.selectedItem = item;
						changed = true;
					}
				}
			}

			if (dispatch && changed) {
				this.dispatchSelectionChange(oldSelectedItem, this.selectedItem, renderer, event);
			}

			return changed;
		},

		dispatchSelectionChange: function (oldSelectedItem, newSelectedItem, renderer, triggerEvent) {
			// summary:
			//		Dispatch a selection change event.
			// oldSelectedItem: Object
			//		The previously selectedItem.
			// newSelectedItem: Object
			//		The new selectedItem.
			// renderer: Object
			//		The visual renderer of the selected/deselected item.
			// triggerEvent: Event
			//		The event that lead to the selection of the item.

			this.emit("selection-change", {
				oldValue: oldSelectedItem,
				newValue: newSelectedItem,
				renderer: renderer,
				triggerEvent: triggerEvent
			});
		}
	});
});