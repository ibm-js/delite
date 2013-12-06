define(["dcl/dcl",
        "dui/register",
        "dojo/_base/lang",
        "dojo/string",
        "dojo/when",
        "dojo/Deferred",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/sniff",
        "dui/Widget",
], function (dcl, register, lang, string, when, Deferred, dom, domConstruct, domClass, has, Widget) {

	// TODO: SHOULD THIS WIDGET BE DEFINED IN ITS OWN SOURCE FILE (IN THIS CASE, A MORE GENERIC "ActionCell" WIDGET) ?
	var LoaderWidget = register("d-list-loader", [HTMLElement, dcl([Widget], {

		clickToLoadMessage: "Click to load more entries",

		loadingMessage: "Loading more entries...",

		parentClass: "",

		_loading: false,

		buildRendering: function () {
			this.style.display = "block";
			this.on("click", lang.hitch(this, this._onClick));
		},

		enteredViewCallback: dcl.after(function () {
			domClass.add(this, this.parentClass + "-loaderNode");
			this.innerHTML = this.clickToLoadMessage;
			this.tabIndex = -1;
		}),

		isLoading: function () {
			return this._loading;
		},

		performLoading: function () {
			// Callback to be implemented by user of the widget
			// It MUST return a promise that is fulfilled when the load operation is finished.
			var def = new Deferred();
			this.defer(function () {
				def.resolve("done");
			}, 500);
			return def;
		},

		beforeLoading: function () {
			domClass.replace(this,
					this.parentClass + "-loaderNodeLoading",
					this.parentClass + "-loaderNode");
			this.innerHTML = this.loadingMessage;
		},

		afterLoading: function () {
			if (!this._destroyed) {
				domClass.replace(this,
						this.parentClass + "-loaderNode",
						this.parentClass + "-loaderNodeLoading");
				this.innerHTML = this.clickToLoadMessage;
			}
		},

		_onClick: function () {
			if (this.isLoading()) { return; }
			this._loading = true;
			this.beforeLoading();
			this.defer(lang.hitch(this, function () {
				when(this.performLoading(), lang.hitch(this, function () {
					this.afterLoading();
					this._loading = false;
				}), lang.hitch(this, function (error) {
					this.afterLoading();
					this._loading = false;
					 // WHAT TO DO WITH THE ERROR ?
					console.log((error.message ? error.message : error) + ". See stack below.");
					console.error(error);
				}));

			}));
		}
	})]);

	return dcl(null, {

		/////////////////////////////////
		// Public attributes
		/////////////////////////////////

		store: null,

		query: null,

		queryOptions: null,

		pageLength: 0, // if > 0 define paging with the number of entries to display per page.
		
		maxPages: 0, // the maximum number of pages to display

		beforeLoadingMessage: "",

		loadingMessage: "Loading ${pageLength} more entries...",

		// If true, automatically loads next/previous page when 
		// scrolling reaches the top/bottom
		autoLoad: false,

		useMaskingPanel: true, // not needed on desktop / high performance devices

		/////////////////////////////////
		// Private attributes
		/////////////////////////////////

		_queryOptions: null,
		_nextPageLoader: null,
		_previousPageLoader: null,
		_firstLoaded: -1,
		_lastLoaded: -1,
		_noExtremity: true,

		/////////////////////////////////
		// Widget lifecycle
		/////////////////////////////////

		enteredViewCallback: dcl.after(function () {
			if (!this.beforeLoadingMessage) {
				this.beforeLoadingMessage = this.autoLoad ? "Loading ${pageLength} more entries..."
						: "Click to load ${pageLength} more entries";
			}
		}),

		destroy: dcl.after(function () {
			if (this._previousPageLoader) {
				this._previousPageLoader.destroy();
				this._previousPageLoader = null;
			}
			if (this._nextPageLoader) {
				this._nextPageLoader.destroy();
				this._nextPageLoader = null;
			}
		}),

		/////////////////////////////////
		// Public methods from List
		/////////////////////////////////

		deleteEntry: dcl.after(function (entryIndex, deleteFromStore) {
			if (deleteFromStore) {
				/////////////////////////////////////////////////
				// TODO: REMOVE FROM STORE (NEED THE ENTRY ID)
				/////////////////////////////////////////////////
				console.log("TODO: remove entry from store (AND UPDATE INTERNAL _firstLoaded / _lastLoaded ?)");
			}
		}),

		/////////////////////////////////
		// Private methods
		/////////////////////////////////

		_loadNext: function (/*Function*/onDataReadyHandler) {
			var def = new Deferred();
			if (!this._queryOptions) {
				this._queryOptions = this.queryOptions ? lang.clone(this.queryOptions) : {};
				if (this.pageLength > 0) {
					this._queryOptions.start =
						(this.queryOptions && this.queryOptions.start ? this.queryOptions.start : 0);
					this._queryOptions.count = this.pageLength;
					this._firstLoaded = this._queryOptions.start;
				}
			}
			if (this._nextPageLoader) {
				this._queryOptions.start = this._lastLoaded + 1;
				this._queryOptions.count = this.pageLength;
			}
			when(this.store.query(this.query, this._queryOptions), lang.hitch(this, function (result) {
				var nbOfEntries = result.length;
				this._lastLoaded = this._queryOptions.start + nbOfEntries - 1;
				when(lang.hitch(this, onDataReadyHandler)(result), function () {
					def.resolve();
				},
				function (error) {
					def.reject(error);
				});
			}), function (error) {
				def.reject(error);
			});
			return def;
		},

		_loadPrevious: function (/*Function*/onDataReadyHandler) {
			var def = new Deferred();
			this._queryOptions.count = this.pageLength;
			this._queryOptions.start = this._firstLoaded - this.pageLength;
			if (this._queryOptions.start < 0) {
				this._queryOptions.count += this._queryOptions.start;
				this._queryOptions.start = 0;
			}
			when(this.store.query(this.query, this._queryOptions), lang.hitch(this, function (result) {
				if (result.length) {
					this._firstLoaded = this._queryOptions.start;
					when(lang.hitch(this, onDataReadyHandler)(result), function () {
						def.resolve();
					}, function (error) {
						def.reject(error);
					});
				}
			}), function (error) {
				def.reject(error);
			});
			return def;
		},

		_unloadFirstEntries: function (nbOfEntriesToRemove) {
			var toDelete = nbOfEntriesToRemove;
			this._firstLoaded += nbOfEntriesToRemove;
			for (; toDelete > 0; toDelete--) {
				this.deleteEntry(0);
			}
			if (!this._previousPageLoader) {
				this._createPreviousPageLoader();
			}
		},

		_unloadLastEntries: function (nbOfEntriesToRemove) {
			var toDelete = nbOfEntriesToRemove;
			this._lastLoaded -= nbOfEntriesToRemove;
			for (; toDelete > 0; toDelete--) {
				this.deleteEntry(this._getEntriesCount() - 1);
			}
			if (!this._nextPageLoader) {
				this._createNextPageLoader();
			}
		},

		_onPreviousPageReady: function (/*array*/ entries) {
			var firstCellBeforeUpdate = this._getFirst(), nbOfEntriesToRemove = 0;
			var def = new Deferred();
			try {
				if (this._previousPageLoader && this._previousPageLoader.isLoading()) {
					this.focusChild(firstCellBeforeUpdate);
				}
				this.addEntries(entries, "top");
				if (this.maxPages) {
					nbOfEntriesToRemove = this._getEntriesCount() - (this.maxPages * this.pageLength);
					if (nbOfEntriesToRemove > 0) {
						this._unloadLastEntries(nbOfEntriesToRemove);
					}
				}
				if (this._firstLoaded ===
					(this.queryOptions && this.queryOptions.start ? this.queryOptions.start : 0)) {
					// no more previous page
					this._previousPageLoader.destroy();
					this._previousPageLoader = null;
				} else {
					this._previousPageLoader.placeAt(this.containerNode, "first");
				}
				if (this._getFocusedCell()) {
					this._focusNextChild(-1);
				} else {
					this.focusChild(this._getLastCell());
				}
				this.defer(lang.hitch(this, function () {
					try {
						// scroll the currently focused child so that it is at the top of the screen
						if (this._isScrollable) {
							this.scrollBy(this._topOfNodeDistanceToTopOfViewport(this._getFocusedCell()));
						} else {
							// TODO: try to scroll the page ?
						}
						def.resolve();
					} catch (error) {
						def.reject(error);
					}
				}));
			} catch (error) {
				def.reject(error);
			}
			return def;
		},

		_onNextPageReady: function (/*array*/ entries) {
			var nbOfEntriesToRemove = 0;
			var def = new Deferred();
			try {
				this.focusChild(this._getLast());
				this.addEntries(entries, "bottom");
				if (this.maxPages) {
					nbOfEntriesToRemove = this._getEntriesCount() - (this.maxPages * this.pageLength);
					if (nbOfEntriesToRemove > 0) {
						this._unloadFirstEntries(nbOfEntriesToRemove);
					}
				}
				if (this._nextPageLoader) {
					if (entries.length !== this._queryOptions.count) {
						// no more next page
						this._nextPageLoader.destroy();
						this._nextPageLoader = null;
					} else {
						this._nextPageLoader.placeAt(this.containerNode);
					}
				} else {
					if (entries.length === this._queryOptions.count) {
						this._createNextPageLoader();
					}
				}
				if (this._getFocusedCell()) {
					this._focusNextChild(1);
				} else {
					this.focusChild(this._getFirstCell());
				}
				this.defer(lang.hitch(this, function () {
					try {
						// scroll the currently focused child so that it is at the bottom of the screen
						if (this._isScrollable) {
							this.scrollBy(this._bottomOfNodeDistanceToBottomOfViewport(this._getFocusedCell()));
						} else {
							// TODO: try to scroll the page
						}
						def.resolve();
					} catch (error) {
						def.reject(error);
					}
				}), 5);
			} catch (error) {
				def.reject(error);
			}
			return def;
		},

		/////////////////////////////////
		// Event handlers
		/////////////////////////////////

		onScroll: dcl.after(function () {
			if (this.autoLoad) {
				if (this._isScrollable) {
					if (this.isTopScroll()) {
						if (this._noExtremity && this._previousPageLoader) {
							this._previousPageLoader._onClick();
						}
						this._noExtremity = false;
					} else if (this.isBottomScroll()) {
						if (this._noExtremity && this._nextPageLoader) {
							this._nextPageLoader._onClick();
						}
						this._noExtremity = false;
					} else {
						this._noExtremity = true;
					}
				}
			}
		}),

		/////////////////////////////////
		// Page loaders & loading panel
		/////////////////////////////////

		_createNextPageLoader: function () {
			this._nextPageLoader = new LoaderWidget({parentClass: this.baseClass,
				clickToLoadMessage: string.substitute(this.beforeLoadingMessage, this),
				loadingMessage: string.substitute(this.loadingMessage, this)});
			if (this._isScrollable && this.useMaskingPanel && this.maxPages > 0) {
				this._nextPageLoader.beforeLoading = lang.hitch(this, this._displayLoadingPanel);
				this._nextPageLoader.afterLoading = lang.hitch(this, this._hideLoadingPanel);
			}
			this._nextPageLoader.performLoading = lang.hitch(this, function () {
				return this._loadNext(this._onNextPageReady);
			});
			this._nextPageLoader.startup();
			if (!this.autoLoad || !has("touch")) {
				this._nextPageLoader.placeAt(this.containerNode);
			}
		},

		_createPreviousPageLoader: function () {
			this._previousPageLoader = new LoaderWidget({parentClass: this.baseClass,
				clickToLoadMessage: string.substitute(this.beforeLoadingMessage, this),
				loadingMessage: string.substitute(this.loadingMessage, this)});
			if (this._isScrollable && this.useMaskingPanel && this.maxPages > 0) {
				this._previousPageLoader.beforeLoading = lang.hitch(this, this._displayLoadingPanel);
				this._previousPageLoader.afterLoading = lang.hitch(this, this._hideLoadingPanel);
			}
			this._previousPageLoader.performLoading = lang.hitch(this, function () {
				return this._loadPrevious(this._onPreviousPageReady);
			});
			this._previousPageLoader.startup();
			if (!this.autoLoad || !has("touch")) {
				this._previousPageLoader.placeAt(this.containerNode, "first");
			}
		},

		_displayLoadingPanel: function () {
			if (!this.autoLoad || !has("touch")) {
				var viewportGeometry = this.getViewportClientRect();
				var message = string.substitute(this.loadingMessage, this);
				this._loadingPanel = domConstruct.create("div",
														 {innerHTML: message,
														  className: this.baseClass + "-loadingPanel",
														  style: "position: absolute; line-height: "
															+ (viewportGeometry.bottom - viewportGeometry.top)
															+ "px; width: "
															+ (viewportGeometry.right - viewportGeometry.left)
															+ "px; top: "
															+ (viewportGeometry.top + window.scrollY)
															+ "px; left: "
															+ (viewportGeometry.left + window.scrollX)
															+ "px;" },
														 document.body);
			}
		},

		_hideLoadingPanel: function () {
			if (!this.autoLoad || !has("touch")) {
				document.body.removeChild(this._loadingPanel);
			}
		},

		/////////////////////////////////
		// List methods overriding
		/////////////////////////////////

		/*jshint unused:false */
		_renderEntries: dcl.superCall(function (sup) {
			return function (entries) {
				when(this._loadNext(sup), lang.hitch(this, function () {
					if (this.pageLength > 0 && this._entries.length === this._queryOptions.count) {
						this._createNextPageLoader();
					}
				}));
			};
		}),

		_getNextCell: dcl.superCall(function (sup) {
			return function (cell) {
				var value = sup.apply(this, arguments);
				if (this._nextPageLoader && value === this._nextPageLoader) {
					value = null;
				}
				return value;
			};
		}),

		_getPreviousCell: dcl.superCall(function (sup) {
			return function (cell) {
				var value = sup.apply(this, arguments);
				if (this._previousPageLoader && value === this._previousPageLoader) {
					value = null;
				}
				return value;
			};
		}),

		_onActionKeydown: dcl.superCall(function (sup) {
			return function (event) {
				if (this._nextPageLoader && dom.isDescendant(event.target, this._nextPageLoader)) {
					event.preventDefault();
					this._nextPageLoader._onClick();
				} else if (this._previousPageLoader && dom.isDescendant(event.target, this._previousPageLoader)) {
					event.preventDefault();
					this._previousPageLoader._onClick();
				} else {
					sup.apply(this, arguments);
				}
			};
		})

	});
});