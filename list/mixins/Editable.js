define(["dcl/dcl",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/on",
        "dojo/dom",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/touch"
], function (dcl, lang, array, on, dom, domClass, domStyle, domConstruct, domGeometry, touch) {

	return dcl(null, {

		/////////////////////////////////
		// Public attributes
		/////////////////////////////////

		moveable: true, // Should be a statefull property

		deleteable: true,  // Should be a statefull property

		deleteFromStore: true,

		/////////////////////////////////
		// Private attributes
		/////////////////////////////////

		_indexOfDeleteableEntry: -1,
		_touchHandlersRefs: null,
		_placeHolder: null,
		_placeHolderClientRect: null,
		_draggedCell: null,
		_touchStartY: null,
		_startTop: null,
		_draggedCellTop: null,
		_draggedEntryIndex: null,
		_dropPosition: -1,

		/////////////////////////////////
		// Public methods
		/////////////////////////////////

		setEditableMode: function (moveable, deleteable) {
			this.moveable = moveable;
			this.deleteable = deleteable;
			// TODO: EVENT HANDLERS, RENDERING, ETC...
		},

		// Called before the deletion of an entry through the UI delete action.
		// If it returns false, the entry is not deleted. The entry is deleted
		// if it returns any other value.
		// TODO: RENAME "beforeEntryDelete" or "beforeEntryDeletion" ?
		/*jshint unused:false */
		onEntryDelete: function (entry, entryIndex) {
			// to be implemented
		},

		/*jshint unused:false */
		onEntryMove: function (entry, originalIndex, newIndex) {
			// to be immplemented
		},

		/////////////////////////////////
		// Widget lifecycle
		/////////////////////////////////

		preCreate: dcl.after(function () {
			this._touchHandlersRefs = [];
		}),

		enteredViewCallback: dcl.after(function () {
			if (this.categoryAttribute) {
				this.moveable = false; // moving entries not yet supported on categorized lists
			}
			if (this.deleteable) {
				this.onCellEvent("click", lang.hitch(this, "_onCellClick"));
			}
			if (this.moveable) {
				this.on(touch.press, lang.hitch(this, "_onEditableTouchPress"));
			}
		}),

		destroy: dcl.after(function () {
			if (this._rightEditNode) {
				if (this._rightEditNode.parentNode) {
					this._rightEditNode.parentNode.removeChild(this._rightEditNode);
				}
				delete this._rightEditNode;
			}
		}),

		/////////////////////////////////
		// List methods
		/////////////////////////////////

		/*jshint unused:false */
		_handleSelection: dcl.superCall(function (sup) {
			return function (event) {
				if (!this.deleteable) { // cannot select / unselect entries while entries are deleteable
					return sup.apply(this, arguments);
				}
			};
		}),

		deleteEntry: dcl.superCall(function (sup) {
			/*jshint unused:false */
			return function (entryIndex, removeFromStore) {
				if (this.onEntryDelete(this._entries[entryIndex], entryIndex) !== false) {
					sup.apply(this, arguments);
				}
			};
		}),

		/////////////////////////////////
		// Private methods
		/////////////////////////////////

		_showDeleteButton: function (entryIndex) {
			// TODO: USE i18n string
			this._setRightEditNodeInnerHTML(entryIndex,
					"<div class='" + this.baseClass + "-deleteButton'>delete</div>");
		},

		_hideDeleteButton: function (entryIndex) {
			var innerHTML = this.moveable
					? "<div class='duiDomButtonGrayKnob' style='cursor: move;'>"
					  + "<div><div><div></div></div></div></div></div>"
					: "<div></div>";
			this._setRightEditNodeInnerHTML(entryIndex, innerHTML);
		},

		_setRightEditNodeInnerHTML: function (entryIndex, innerHTML) {
			var cell = this._getCellByEntryIndex(entryIndex);
			if (cell) {
				cell.children[2].innerHTML = innerHTML;
			}
		},

		_isRightEditNodeDescendant: function (node) {
			var currentNode = node;
			while (currentNode) {
				if (domClass.contains(currentNode, "duiListEntryRightEdit")) {
					return true;
				}
				currentNode = currentNode.parentNode;
			}
			return false;
		},

		////////////////////////////////////
		// TODO: SUPPORT DELETETION / ADDITIONS AT THE STORE LEVEL
		//       (HERE OR IN StoreModel ?)
		////////////////////////////////////

		////////////////////////////////////
		// TODO: KEYBOARD NAVIGATION !!!
		////////////////////////////////////

		_createEntryCell: dcl.superCall(function (sup) {
			return function (entry, entryIndex) {
				var cell = sup.apply(this, arguments);
				// This is a new cell
				if (this.deleteable || this.moveable) {
					domConstruct.create("div", {innerHTML: this.moveable
						? "<div class='duiDomButtonGrayKnob' style='cursor: move;'>"
						  + "<div><div><div></div></div></div></div></div>"
						: "<div></div>",
						className: "duiListEntryRightEdit"}, cell);
				}
				if (this.deleteable) {
					domConstruct.create("div", {innerHTML:
						"<div class='duiDomButtonRedCircleMinus' style='cursor: pointer;'>"
						+ "<div><div><div></div></div></div></div></div>",
						className: "duiListEntryLeftEdit"}, cell, 0);
				}
				return cell;
			};
		}),

		_onCellClick: function (evt, entryIndex) {
			var node = evt.target;
			var resetDeleteableEntry = true;
			if (this.deleteable) {
				while (node && !domClass.contains(node, this.baseClass + this._cssSuffixes.container)) {
					if (domClass.contains(node, "duiListEntryLeftEdit")) {
						if (this._indexOfDeleteableEntry === entryIndex) {
							// do nothing
							resetDeleteableEntry = false;
							break;
						} else if (this._indexOfDeleteableEntry >= 0) {
							this._hideDeleteButton(this._indexOfDeleteableEntry);
						}
						this._showDeleteButton(entryIndex);
						this._indexOfDeleteableEntry = entryIndex;
						resetDeleteableEntry = false;
						break;
					} else if (domClass.contains(node, "duiListEntryRightEdit")) {
						if (this._indexOfDeleteableEntry === entryIndex) {
							this._hideDeleteButton(entryIndex);
							this._indexOfDeleteableEntry = -1;
							this.deleteEntry(entryIndex, this.deleteFromStore);
						}
						break;
					}
					node = node.parentNode;
				}
			}
			if (resetDeleteableEntry && this._indexOfDeleteableEntry >= 0) {
				this._hideDeleteButton(this._indexOfDeleteableEntry);
				this._indexOfDeleteableEntry = -1;
			}
		},

		///////////////////////////////
		// Moveable implementation
		///////////////////////////////
		
		_onEditableTouchPress: function (event) {
			if (this._draggedCell) {
				return;
			}
			var cell = this._getParentCell(event.target),
				cellEntryIndex = this._getCellEntryIndex(cell);
			if (cell && this._isRightEditNodeDescendant(event.target)) {
				if (cellEntryIndex === this._indexOfDeleteableEntry) {
					return;
				}
				this._draggedCell = cell;
				this._draggedEntryIndex = cellEntryIndex;
				this._dropPosition = cellEntryIndex;
				this._placeHolder = domConstruct.create("div",
						{className: this.baseClass + this._cssSuffixes.entry});
				this._placeHolder.style.height = this._draggedCell.getHeight() + "px";
				this._placePlaceHolder(this._draggedCell, "after");
				this._setDraggable(this._draggedCell, true);
				this._touchStartY = event.touches ? event.touches[0].pageY : event.pageY;
				this._startTop = domGeometry.getMarginBox(this._draggedCell).t;
				this._touchHandlersRefs.push(this.own(on(document, touch.release,
						lang.hitch(this, "_onEditableTouchRelease")))[0]);
				this._touchHandlersRefs.push(this.own(on(document, touch.move,
						lang.hitch(this, "_onEditableTouchMove")))[0]);
				event.preventDefault();
				event.stopPropagation();
			}
		},

		_onEditableTouchMove: function (event) {
			///////////////////////////////////////////////////////////
			// TODO: CATEGORIZED LISTS SUPPORT
			///////////////////////////////////////////////////////////
			var	pageY = event.touches ? event.touches[0].pageY : event.pageY,
				clientY = event.touches ? event.touches[0].clientY : event.clientY;
			this._draggedCellTop = this._startTop + (pageY - this._touchStartY);
			this._stopEditableAutoScroll();
			this._draggedCell.style.top = this._draggedCellTop + "px";
			this._updatePlaceholderPosition(clientY);
			event.preventDefault();
			event.stopPropagation();
		},

		_updatePlaceholderPosition: function (clientY) {
			var nextCell, previousCell;
			if (clientY < this._placeHolderClientRect.top) {
				previousCell = this._getPreviousCell(this._placeHolder);
				if (previousCell === this._draggedCell) {
					previousCell = this._getPreviousCell(previousCell);
				}
				if (previousCell) {
					this._placePlaceHolder(previousCell, "before");
					this._dropPosition--;
				}
			} else if (clientY > this._placeHolderClientRect.bottom) {
				nextCell = this._getNextCell(this._placeHolder);
				if (nextCell === this._draggedCell) {
					nextCell = this._getNextCell(nextCell);
				}
				if (nextCell) {
					this._placePlaceHolder(nextCell, "after");
					this._dropPosition++;
				}
			}
			if (this._isScrollable) {
				var viewportRect = this.getViewportClientRect();
				if (clientY < viewportRect.top + 15) {
					this._editableAutoScroll(-15, clientY);
				} else if (clientY > viewportRect.top + viewportRect.height - 15) {
					this._editableAutoScroll(15, clientY);
				} else {
					this._stopEditableAutoScroll();
				}
			}
		},

		_editableAutoScroll: function (rate, clientY) {
			this._editableAutoScrollID = setTimeout(lang.hitch(this, function () {
				var oldScroll = this._scroll;
				this.scrollBy(rate);
				setTimeout(lang.hitch(this, function () {
					if (this._scroll !== oldScroll) {
						if (this._placeHolder) {
							this._placeHolderClientRect = this._placeHolder.getBoundingClientRect();
							this._startTop += rate;
							this._draggedCellTop += rate;
							this._draggedCell.style.top = this._draggedCellTop + "px";
							this._updatePlaceholderPosition(clientY);
						}
					}
				}));
			}), 50);
		},

		_stopEditableAutoScroll: function () {
			if (this._editableAutoScrollID) {
				clearTimeout(this._editableAutoScrollID);
				this._editableAutoScrollID = null;
			}
		},

		_onEditableTouchRelease: function (event) {
			if (this._draggedCell) {
				if (this._dropPosition >= 0) {
					if (this._dropPosition !== this._draggedEntryIndex) {
						// TODO: ADD A HANDLER THAT IS ABLE TO CANCEL THE MOVE !!!
						this.moveEntry(this._draggedEntryIndex, this._dropPosition);
					}
					this._draggedEntryIndex = null;
					this._dropPosition = -1;
				}
				this.defer(function () { // iPhone needs setTimeout (via defer)
					this._setDraggable(this._draggedCell, false);
					this._draggedCell = null;
				});
				array.forEach(this._touchHandlersRefs, function (handlerRef) {
					handlerRef.remove();
				});
				this._touchHandlersRefs = [];
				if (this._placeHolder) {
					this._placeHolder.parentNode.removeChild(this._placeHolder);
					this._placeHolder = null;
				}
				event.preventDefault();
				event.stopPropagation();
			}
		},

		_setDraggable: function (node, draggable) {
			if (draggable) {
				domStyle.set(node, {
					width: domGeometry.getContentBox(node).w + "px",
					top: node.offsetTop + "px"
				});
				domClass.add(node, "duiListEntryDragged");
			} else {
				domClass.remove(node, "duiListEntryDragged");
				domStyle.set(node, {
					width: "",
					top: ""
				});
			}
			if (this._isScrollable) {
				this.disableTouchScroll = draggable;
			}
		},
		
		_placePlaceHolder: function (refNode, pos) {
			domConstruct.place(this._placeHolder, refNode, pos);
			this._placeHolderClientRect = this._placeHolder.getBoundingClientRect();
		}

	});
});