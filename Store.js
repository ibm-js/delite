define(["dcl/dcl", "dojo/_base/lang", "dojo/when", "./Invalidating"], function (dcl, lang, when, Invalidating) {

	var isStoreInvalidated = function (props) {
		return props.store || props.query || props.queryOptions;
	};

	var setStoreValidate = function (props) {
		props.store = props.query = props.queryOptions = false;
	};

	return dcl(Invalidating, {

		// summary:
		//		Mixin for widgets for store management that creates widget render items from store items after
		//		querying the store. The receiving class must extend dojo/Stateful and dojo/Evented or
		//		delite/Widget.
		// description:
		//		Classes extending this mixin automatically create render items that are consumable by the widget
		//		from store items after querying the store. This happens each time the widget store, query or
		//		queryOptions properties are set. If that store is Observable it will be observed and render items
		//		will be automatically updated, added or deleted from the items property based on store notifications.

		// store: dojo/store/Store
		//		The store that contains the items to display.
		store: null,

		// filter: Object
		//		A filter to apply to the store.
		filter: {},

		// renderItems: Array
		//		The render items corresponding to the store items for this widget. This is filled from the store and
		//		is not supposed to be modified directly. Initially null.
		renderItems: null,

		preCreate: function () {
			// we want to be able to wait for potentially several of those properties to be set before
			// actually firing the store request
			this.addInvalidatingProperties({
					"store": "invalidateProperty",
					"query": "invalidateProperty",
					"queryOptions": "invalidateProperty"
				}
			);
		},

		renderItemToItem: function (/*Object*/ renderItem) {
			// summary:
			//		Creates a store item from the render item. By default it returns the render item itself.
			// renderItem: Object
			//		The render item.
			// returns: Object
			return renderItem;
		},

		itemToRenderItem: function (item) {
			// summary:
			//		Returns the render item for a given store item. By default it returns the store item itself.
			// item: Object
			//		The store item.
			// tags:
			//		protected
			return item;
		},

		initItems: function (renderItems) {
			// summary:
			//		This method is called once the query has been executed to initial the renderItems array
			//		with the list of initial render items.
			// description:
			//		This method sets the renderItems property to the render items array passed as parameter. Once
			//		done, it fires a 'query-success' event.
			// renderItems:
			//		The array of initial render items to be set in the renderItems property.
			// tags:
			//		protected
			this.renderItems = renderItems;
			this.emit("query-success", { renderItems: renderItems, cancelable: false, bubbles: true });
		},

		refreshProperties: function (props) {
			// summary:
			//		Query the store, create the render items and call initItems() when ready. If an error occurs
			//		a 'query-error' event will be fired.
			// tags:
			//		protected
			if (isStoreInvalidated(props)) {
				this._untrack();
				setStoreValidate(props);
				var store = this.store.filter(this.filter);
				if (store != null) {
					if (store.track) {
						// user asked us to observe the store
						var tracked = this._tracked = store.track();
						tracked.on("add", this.itemAdded.bind(this));
						tracked.on("update", this.itemUpdated.bind(this));
						tracked.on("remove", this.itemRemoved.bind(this));
					}
					// if we have a mapping function between store item and some intermediary items use it
					when(store.map(function (item) {
						return this.itemToRenderItem(item);
					}, this), lang.hitch(this, this.initItems), lang.hitch(this, "_queryError"));
				} else {
					this.initItems([]);
				}
			}
		},

		_queryError: function (error) {
			this.emit("query-error", { error: error, cancelable: false, bubbles: true });
		},

		_untrack: function () {
			if (this._tracked) {
				this._tracked.tracking.remove();
				this._tracked = null;
			}
		},

		destroy: function () {
			this._untrack();
		},

		itemRemoved: function (event) {
			// summary:
			//		When the store is observed and an item is removed in the store this method is called to remove the
			//		corresponding render item. This can be redefined but must not be called directly.
			// event: Event
			//		The "remove" dstore/Observable event
			// tags:
			//		protected
			this.renderItems.splice(event.previousIndex, 1);
			// set back the modified items property
			this.renderItems = this.renderItems;
		},

		itemUpdated: function (event) {
			// summary:
			//		When the store is observed and an item is updated in the store this method is called to update the
			//		corresponding render item. This can be redefined but must not be called directly.
			// event: Event
			//		The "update" dstore/Observable event
			// tags:
			//		protected
			if (event.index === undefined) {
				// this is actually a remove
				this.renderItems.splice(event.previousIndex, 1);
			} else if (event.previousIndex === undefined) {
				// this is actually a add
				this.renderItems.splice(event.index, 0, this.itemToRenderItem(event.target));
			} else if (event.index !== event.previousIndex) {
				// this is a move
				this.renderItems.splice(event.previousIndex, 1);
				this.renderItems.splice(event.index, 0, this.itemToRenderItem(event.target));
			} else {
				// we want to keep the same item object and mixin new values into old object
				dcl.mix(this.renderItems[event.index], this.itemToRenderItem(event.target));
			}
			// set back the modified items property
			this.renderItems = this.renderItems;
		},

		itemAdded: function (event) {
			// summary:
			//		When the store is observed and an item is added in the store this method is called to add the
			//		corresponding render item. This can be redefined but must not be called directly.
			// event: Event
			//		The "add" dstore/Observable event
			// tags:
			//		protected
			if (event.index) {
				this.renderItems.splice(event.index, 0, this.itemToRenderItem(event.target));
				// set back the modified items property
				this.renderItems = this.renderItems;
			}
			// if no index the item is added outside of the range we monitor so we don't care
		}
	});
});
