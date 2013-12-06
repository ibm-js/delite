define(["dcl/dcl",
        "./register",
        "dojo/_base/lang",
        "dojo/when",
        "dojo/on",
        "dojo/query",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/keys",
        "dui/Widget",
        "dui/Container",
        "dui/Selection",
        "dui/KeyNav",
        "./list/DefaultEntryRenderer",
        "./list/DefaultCategoryRenderer"
], function (dcl, register, lang, when, on, query, dom, domConstruct, domClass, keys, Widget, Container,
		Selection, KeyNav, DefaultEntryRenderer, DefaultCategoryRenderer) {

	// TODO: use cell instead of node or cellNode. Other options, use itemNode instead of cell / cellNode / node.
	var List = dcl([Widget, Container, Selection, KeyNav], {

		/////////////////////////////////
		// Public attributes
		/////////////////////////////////

		// The ordered entries to render in the list. You can also use the dui/list/StoreModel mixin to
		// populate this list of entries using a dojo object store, in which case there is no need to
		// define a value for this attribute.
		entries: [],
		_setEntriesAttr: function (value) {
			var val = value;
			if (val && val.length) {
				if (typeof val[0] === "string") {
					var json = val.join().replace(/,/g, " ").replace(/}[\s\t]*{/g, "},{");
					if (json.match(/^[\s\t]*\[/)) {
						val = eval(json);
						// FIXME: CAN WE DO WITHOUT EVAL (USING JSON.parse ?)
						// OR SHOULD WE REMOVE THIS FEATURE FROM LIST ?
					}
				}
			}
			if (!val) {
				val = [];
			}
			this._set("entries", val);
		},

		 // Name of the list entry attribute that define the category of a list entry.
		//  If falsy, the list is not categorized.
		categoryAttribute: null,

		// The widget class to use to render list entries. It MUST extend the dui/list/AbstractEntryRenderer class.
		entriesRenderer: DefaultEntryRenderer,

		// The widget class to use to render category headers when the list entries are categorized.
		// It MUST extend the dui/list/AbstractEntryRenderer class.
		categoriesRenderer: DefaultCategoryRenderer,

		// The base class that defines the style of the list.
		// Available values are:
		// - "duiRoundRectList" (default), that render a list with rounded corners and left and right margins;
		// - "duiEdgeToEdgeList", that render a list with no rounded corners and no left and right margins.
		baseClass: "duiRoundRectList",

		// The selection mode for list entries (see dui/mixins/Selection).
		selectionMode: "none",

		/////////////////////////////////
		// Private attributes
		/////////////////////////////////

		_cssSuffixes: {entry: "-entry",
					   category: "-category",
					   selected: "-selectedEntry",
					   loading: "-loading",
					   container: "-container"},
		_initialized: false,
		_cellCategoryHeaders: null,
		_entries: null,

		/////////////////////////////////
		// Widget lifecycle
		/////////////////////////////////

		preCreate: function () {
			this._cellCategoryHeaders = {};
			this._entries = [];
		},

		buildRendering: function () {
			var i, len, cell;
			this.style.display = "block";
			this.dojoClick = false; // this is to avoid https://bugs.dojotoolkit.org/ticket/17578
			// TODO: REPLACE NEXT LINE BY this.containerNode = this ?
			this.containerNode = domConstruct.create("div", {className: this.baseClass + this._cssSuffixes.container,
															 tabIndex: -1}, this);
			if (this.childNodes.length > 1) {
				// reparent
				len = this.childNodes.length - 1;
				for (i = 0; i < len; i++) {
					cell = this.firstChild;
					// make sure tabIndex is -1 for keyboard navigation
					cell.tabIndex = -1;
					// TODO: CAN WE HAVE CATEGORIES HERE ???
					domClass.add(cell, this.baseClass + this._cssSuffixes.entry);
					this.containerNode.appendChild(cell);
					// TODO: IGNORE this.entries attribute in startup if entries are added using markup
				}
			}
		},

		enteredViewCallback: function () {
			// FIXME: THIS IS A WORKAROUND, BECAUSE Widget.enteredViewCallback IS RESETING THE TAB INDEX TO -1.
			// => WITH THIS WORKAROUND, ANY CUSTOM TABINDEX SET ON A WIDGET NODE IS IGNORED AND REPLACED WITH 0
			this._enteredView = true;
			this.setAttribute("tabindex", "0");
			this.tabIndex = "0";
			// END OF WORKAROUND

			// This is not a workaround and should be defined here,
			// when we have the real initial value for this.selectionMode
			// FIXME: WHEN REMOVING THE WORKAROUND, enteredViewCallback must be a dcl.after method
			if (this.selectionMode !== "none") {
				this.on("click", lang.hitch(this, "_handleSelection"));
			}
		},

		startup: dcl.superCall(function (sup) {
			return function () {
				if (this._started) {
					return;
				}
				sup.apply(this, arguments);
				this._toggleListLoadingStyle();
				// TODO: use when(this._renderEntries(), function () {
				//		this._toggleListLoadingStyle();
				//		this._initialized = true;
				// }); AND REMOVE initit code from _renderEntries .????
				this._renderEntries(this.entries);
			};
		}),

		/////////////////////////////////
		// Public methods
		/////////////////////////////////

		// Register a handler for a type of events generated in any of the list cells.
		// Parameters:
		//		event: the type of events ("click", ...)
		//		handler: the event handler
		// When the event handler is called, it receive the list as its first parameter, the event
		// as its second and the index of the list entry displayed in the cell.
		// TODO: WHAT IF THE CELL IS A CATEGORY HEADER ???
		onCellEvent: function (event, handler) {
			var that = this;
			return this.on(event, function (e) {
				var parentCell;
				if (domClass.contains(e.target, this.baseClass)) {
					return;
				} else {
					parentCell = that._getParentCell(e.target);
					if (parentCell) {
						// TODO: Pass the parentCell too ?
						// Or run the handler in the parentCell context and pass the list ?
						// TODO: Pass the parentCell INSTEAD of the entry index,
						// as it contains itself the entry index and the entry ?
						return handler.call(that, e, that._getCellEntryIndex(parentCell));
					}
				}
			});
		},

		/*jshint unused:false */
		addEntry: function (entry, entryIndex) {
			/////////////////////////////////
			// TODO: IMPLEMENT THIS
			/////////////////////////////////
		},

		deleteEntry: function (entryIndex) {
			var cell = this._getCellByEntryIndex(entryIndex);
			// Make sure that the cell is not selected before removing it
			if (this.isSelected(entryIndex)) {
				this.setSelected(entryIndex, false);
			}
			// Update the model
			this._entries.splice(entryIndex, 1);
			// Then update the rendering
			if (cell) {
				this._removeCell(cell);
			}
			/////////////////////////////////////////////////////////////////////
			// TODO: IF DELETED CELL HAD FOCUS, MOVE THE FOCUS
			/////////////////////////////////////////////////////////////////////
		},

		moveEntry: function (entryIndex, newIndex) {
			/////////////////////////////////
			// TODO: IMPLEMENT THIS
			/////////////////////////////////
			console.log("TODO: move entry " + entryIndex + " to " + newIndex);
		},

		/////////////////////////////////
		// Selection implementation
		/////////////////////////////////

		getIdentity: function (item) {
			return item;
		},

		updateRenderers: function (entryIndexes) {
			var entryIndex, cell;
			if (this.selectionMode !== "none") {
				for (var i = 0; i < entryIndexes.length; i++) {
					entryIndex = entryIndexes[i];
					cell = this._getCellByEntryIndex(entryIndex);
					if (cell) {
						this._setSelectionStyle(cell, entryIndex);
					}
				}
			}
		},

		/////////////////////////////////
		// Private methods
		/////////////////////////////////

		_renderEntries: function (/*Array*/ entries) {
			this.addEntries(entries, "top");
			if (!this._initialized) {
				this._toggleListLoadingStyle();
				this._initialized = true;
			}
		},

		_toggleListLoadingStyle: function () {
			domClass.toggle(this, this.baseClass + this._cssSuffixes.loading);
		},

		_getEntriesCount: function () {
			return this._entries.length;
		},

		_getEntry: function (index) {
			return this._entries[index];
		},

		/////////////////////////////////
		// Private methods for cell life cycle
		/////////////////////////////////

		addEntries: function (/*Array*/ entries, pos) {
			// TODO: use "first" / "last" instead of "top" / "bottom"
			if (pos === "top") {
				if (this.containerNode.firstElementChild) {
					this.containerNode.insertBefore(this._createCells(entries, 0, entries.length),
							this.containerNode.firstElementChild);
				} else {
					this.containerNode.appendChild(this._createCells(entries, 0, entries.length));
				}
				this._entries = entries.concat(this._entries);
			} else if (pos === "bottom") {
				this.containerNode.appendChild(this._createCells(entries, 0, entries.length));
				this._entries = this._entries.concat(entries);
			} else {
				console.log("addEntries: only top and bottom positions are supported.");
			}
		},

		_createCells: function (/*Array*/ entries, firstEntryIndex, count) {
			var currentIndex = firstEntryIndex,
				currentEntry, lastEntryIndex = firstEntryIndex + count - 1,
				previousEntry = firstEntryIndex > 0 ? entries[firstEntryIndex - 1] : null;
			var documentFragment = document.createDocumentFragment();
			for (; currentIndex <= lastEntryIndex; currentIndex++) {
				currentEntry = entries[currentIndex];
				if (this.categoryAttribute) {
					if (!previousEntry
							|| currentEntry[this.categoryAttribute] !== previousEntry[this.categoryAttribute]) {
						documentFragment.appendChild(this._createCategoryCell(currentEntry[this.categoryAttribute]));
					}
				}
				documentFragment.appendChild(this._createEntryCell(currentEntry, currentIndex));
				previousEntry = currentEntry;
			}
			return documentFragment;
		},

		_removeCell: function (cell, resizeSpacer) {
			// Update category headers before removing the cell, if necessary
			this._updateCategoryHeaderBeforeCellDisappear(cell, resizeSpacer);
			// remove the cell
			cell.destroy();
		},

		_updateCategoryHeaderBeforeCellDisappear: function (cell, resizeSpacer) {
			var cellIsCategoryHeader = this._cellRendersCategoryHeader(cell),
				nextCell, previousCell;
			if (this.categoryAttribute && !cellIsCategoryHeader) {
				previousCell = this._getPreviousCell(cell);
				// remove the previous category header if necessary
				if (previousCell && this._cellRendersCategoryHeader(previousCell)) {
					nextCell = this._getNextCell(cell);
					if (!nextCell || (nextCell && this._cellRendersCategoryHeader(nextCell))) {
						this._removeCell(previousCell, resizeSpacer);
					}
				}
			}
		},

		_createEntryCell: function (entry, entryIndex) {
			var renderedEntry = new this.entriesRenderer({tabindex: "-1"});
			domClass.add(renderedEntry, this.baseClass + this._cssSuffixes.entry);
			renderedEntry.startup();
			renderedEntry._setEntryIndexAttr(entryIndex);
			renderedEntry._setEntryAttr(entry);
//			renderedEntry.set("entryIndex", entryIndex);
//			renderedEntry.set("entry", entry);
			//////////////////////////////////
			// TODO: UPDATE OR REMOVE THIS ? (NOTIFY RENDERER OF ITS SELECTION STATUS ?)
			//////////////////////////////////
			this._setSelectionStyle(renderedEntry, entryIndex);
			this._setCellCategoryHeader(renderedEntry, null); // TODO: IS IT NEEDED ?
			return renderedEntry;
		},

		_createCategoryCell: function (category) {
			var renderedCategory = new this.categoriesRenderer({category: category, tabindex: "-1"});
			domClass.add(renderedCategory, this.baseClass + this._cssSuffixes.category);
			renderedCategory.startup();
			this._setCellCategoryHeader(renderedCategory, category);
			return renderedCategory;
		},

		/////////////////////////////////////////////////
		// TODO: MOVE THIS TO THE ENTRY RENDERER ???
		/////////////////////////////////////////////////
		_setSelectionStyle: function (cell, entryIndex) {
			if (this.selectionMode !== "none") {
				if (this.isSelected(entryIndex)) {
					domClass.add(cell, this.baseClass + this._cssSuffixes.selected);
				} else {
					domClass.remove(cell, this.baseClass + this._cssSuffixes.selected);
				}
			}
		},

		_getNextCell: function (cell) {
			return cell.nextElementSibling;
		},

		_getPreviousCell: function (cell) {
			return cell.previousElementSibling;
		},

		_getFirstCell: function () {
			var firstCell = this._getCellByEntryIndex(0);
			if (this.categoryAttribute) {
				var previousCell = null;
				if (firstCell) {
					previousCell = firstCell.previousElementSibling;
					if (previousCell && domClass.contains(previousCell, this.baseClass + this._cssSuffixes.category)) {
						firstCell = previousCell;
					}
				}
			}
			return firstCell;
		},

		_getLastCell: function () {
			var lastCell = this._getCellByEntryIndex(this._getEntriesCount() - 1);
			if (this.categoryAttribute) {
				var nextCell = null;
				if (lastCell) {
					nextCell = lastCell.nextElementSibling;
					if (nextCell && domClass.contains(nextCell, this.baseClass + this._cssSuffixes.category)) {
						lastCell = nextCell;
					}
				}
			}
			return lastCell;
		},

		_getCellByEntryIndex: function (entryIndex) {
			return query("." + this.baseClass + this._cssSuffixes.entry, this.containerNode)[entryIndex];
		},

		_getCellEntryIndex: function (cell) {
			var index = query("." + this.baseClass + this._cssSuffixes.entry, this.containerNode).indexOf(cell);
			return index < 0 ? null : index;
			
		},

		_getCellCategoryHeader: function (cell) {
			return this._cellCategoryHeaders[cell.id];
		},

		_setCellCategoryHeader: function (cell, categoryName) {
			if (categoryName === null) {
				delete this._cellCategoryHeaders[cell.id];
			} else {
				this._cellCategoryHeaders[cell.id] = categoryName;
			}
		},

		_getParentCell: function (node) {
			var currentNode = dom.byId(node);
			while (currentNode) {
				if (currentNode.parentNode && domClass.contains(currentNode.parentNode,
						this.baseClass + this._cssSuffixes.container)) {
					break;
				}
				currentNode = currentNode.parentNode;
			}
			if (currentNode) {
				return currentNode;
			} else {
				return null;
			}
		},

		_cellRendersCategoryHeader: function (cell) {
			return (this._getCellCategoryHeader(cell) != null);
		},

		/////////////////////////////////
		// Keyboard navigation (KeyNav implementation)
		/////////////////////////////////

		// Handle keydown events
		_onContainerKeydown: dcl.before(function (evt) {
			var continueProcessing = true, cell = this._getFocusedCell();
			if (cell && cell.onKeydown) {
				// onKeydown implementation can return false to cancel the default action
				continueProcessing = cell.onKeydown(evt);
			}
			if (continueProcessing !== false) {
				if ((evt.keyCode === keys.SPACE && !this._searchTimer) || evt.keyCode === keys.ENTER) {
					this._onActionKeydown(evt);
				}
			}
		}),

		// Handle SPACE and ENTER keys
		_onActionKeydown: function (evt) {
			if (this.selectionMode !== "none") {
				evt.preventDefault();
				this._handleSelection(evt);
			}
		},

		childSelector: function (child) {
			return child;
		},

		_getFirst: function () {
			var cell = this._getFirstCell();
			while (cell) {
				if (this._topOfNodeIsBelowTopOfViewport(cell)) {
					break;
				}
				cell = cell.nextElementSibling;
			}
			return cell;
		},

		_getLast: function () {
			var cell = this._getLastCell();
			while (cell) {
				if (this._bottomOfNodeIsBeforeBottomOfViewport(cell)) {
					break;
				}
				cell = cell.previousElementSibling;
			}
			return cell;
		},

		_getNext: function (child, dir) {
			var focusedCell, refChild, returned = null;
			if (this.focusedChild) {
				focusedCell = this._getFocusedCell();
				if (focusedCell === this.focusedChild) {
					// The cell itself has the focus
					refChild = child || this.focusedChild;
					if (refChild) {
						// do not use _nextCell and _previousCell as we want to include the pageloader
						// if it exists
						returned = refChild[(dir === 1) ? "nextElementSibling" : "previousElementSibling"];
					}
				} else {
					// A descendant of the cell has the focus
					// FIXME: can it be a category header, with no _getNextFocusableChild method ?
					returned = focusedCell._getNextFocusableChild(child, dir);
				}
			} else {
				returned = (dir === 1 ? this._getFirst() : this._getLast());
			}
			return returned;
		},

		_onLeftArrow: function () {
			var nextChild;
			if (this._getFocusedCell()._getNextFocusableChild) {
				nextChild = this._getFocusedCell()._getNextFocusableChild(null, -1);
				if (nextChild) {
					this.focusChild(nextChild);
				}
			}
		},

		_onRightArrow: function () {
			var nextChild;
			if (this._getFocusedCell()._getNextFocusableChild) {
				nextChild = this._getFocusedCell()._getNextFocusableChild(null, 1);
				if (nextChild) {
					this.focusChild(nextChild);
				}
			}
		},

		_onDownArrow: function () {
			this._focusNextChild(1);
		},

		_onUpArrow: function () {
			this._focusNextChild(-1);
		},

		_focusNextChild: function (dir) {
			var child, cell = this._getFocusedCell();
			if (cell) {
				if (cell === this.focusedChild) {
					child = this._getNext(cell, dir);
					if (!child) {
						child = cell;
					}
				} else {
					child = cell;
				}
				this.focusChild(child);
			}
		},

		_getFocusedCell: function () {
			return this.focusedChild ? this._getParentCell(this.focusedChild) : null;
		},

		_topOfNodeIsBelowTopOfViewport: function (node) {
			return this._topOfNodeDistanceToTopOfViewport(node) >= 0;
		},

		_topOfNodeDistanceToTopOfViewport: function (node) {
			return node.offsetTop - (this._isScrollable ? this.getCurrentScroll() : 0);
		},

		_bottomOfNodeIsBeforeBottomOfViewport: function (node) {
			return this._bottomOfNodeDistanceToBottomOfViewport(node) <= 0;
		},

		_bottomOfNodeDistanceToBottomOfViewport: function (node) {
			var viewportClientRect = this.getViewportClientRect();
			return node.offsetTop
				+ node.offsetHeight
				- (this._isScrollable ? this.getCurrentScroll() : 0)
				- (viewportClientRect.bottom - viewportClientRect.top);
		},

		getViewportClientRect: function () {
			return this.getBoundingClientRect();
		},

		/////////////////////////////////
		// Other event handlers
		/////////////////////////////////

		_handleSelection: function (event) {
			var entryIndex, entrySelected, eventCell;
			eventCell = this._getParentCell(event.target || event.srcElement);
			entryIndex = this._getCellEntryIndex(eventCell);
			if (entryIndex != null) {
				entrySelected = !this.isSelected(entryIndex);
				this.setSelected(entryIndex, entrySelected);
				this.emit(entrySelected ? "entrySelected" : "entryDeselected", {entryIndex: entryIndex});
			}
		}

	});

	return register("d-list", [HTMLElement, List]);
});