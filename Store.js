define(["dcl/dcl", "dojo/when", "./Invalidating"], function (dcl, when, Invalidating) {

	var isStoreInvalidated = function (props) {
		return props.store || props.query;
	};

	var setStoreValidate = function (props) {
		props.store = props.query = false;
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

		// query: Object
		//		A query filter to apply to the store. Default is {}.
		query: {},

		// preProcessStore: Function
		//		An optional function that processes the store/collection and returns a new collection (to sort it, 
		//		range it etc...). 
		//		This processing is applied before potentially tracking the store for modifications (if Observable).
		//		Changing this function on the instance will not automatically refresh the class.
		//		Default is just an identity function.
		preProcessStore: function (store) { return store; },
		
		// postProcessStore: 
		//		An optional function that processes the store/collection and returns a new collection (to sort it, 
		//		range it etc...). 
		//		This processing is applied after potentially tracking the store for modifications (if Observable).
		//		This allows for example to be notified of modifications that occurred outside of the range.
		//		Changing this function on the instance will not automatically refresh the class.
		//		Default is just an identity function.
		postProcessStore: function (store) { return store; },

		// renderItems: Array
		//		The render items corresponding to the store items for this widget. This is filled from the store and
		//		is not supposed to be modified directly. Initially null. 
		renderItems: null,

		preCreate: function () {
			// we want to be able to wait for potentially several of those properties to be set before
			// actually firing the store request
			this.addInvalidatingProperties({
					"store": "invalidateProperty",
					"query": "invalidateProperty"
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
				setStoreValidate(props);
				this.queryStoreAndInitItems(this.preProcessStore, this.postProcessStore);
			}
		},

		queryStoreAndInitItems: function (preProcessStore, postProcessStore) {
			// summary:
			//		Query the store, create the render items and call initItems() when ready. If an error occurs
			//		a 'query-error' event will be fired. 
			// description:  This method is not supposed to be called by application developer.
			//		It will be called automatically when modifying the store related properties or by the subclass
			//		if needed.
			// returns: 
			//		If store to be processed is not null a promise that will be resolved when the loading process 
			//		will be finished.
			// tags:
			//		protected
			this._untrack();
			if (this.store != null) {
				var collection = preProcessStore.call(this, this.store.filter(this.query));
				if (collection.track) {
					// user asked us to observe the store
					var tracked = this._tracked = collection.track();
					tracked.on("add", this._itemAdded.bind(this));
					tracked.on("update", this._itemUpdated.bind(this));
					tracked.on("remove", this._itemRemoved.bind(this));
				}
				collection = postProcessStore.call(this, collection);
				// if we have a mapping function between store item and some intermediary items use it
				return when(collection.map(function (item) {
					return this.itemToRenderItem(item);
				}, this)).then(this.initItems.bind(this), this._queryError.bind(this));
			} else {
				this.initItems([]);
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

		itemRemoved: function (index, renderItems) {
			// summary:
			//		This method is called when an item is removed from an observable store. The default 
			//		implementation actually removes a renderItem from the renderItems array. This can be redefined but
			//		must not be called directly.
			// index: Number
			//		The index of the render item to remove.
			// renderItems: Array
			//		The array of render items to remove the render item from.
			// tags:
			//		protected
			renderItems.splice(index, 1);
		},

		itemAdded: function (index, renderItem, renderItems) {
			// summary:
			//		This method is called when an item is added in an observable store. The default 
			//		implementation actually adds the renderItem to the renderItems array. This can be redefined but
			//		must not be called directly.
			// index: Number
			//		The index where to add the render item.
			// renderItem: Object
			//		The render item to be added.
			// renderItems: Array
			//		The array of render items to add the render item to.
			// tags:
			//		protected
			renderItems.splice(index, 0, renderItem);
		},

		itemUpdated: function (index, renderItem, renderItems) {
			// summary:
			//		This method is called when an item is updated in an observable store. The default 
			//		implementation actually updates the renderItem in the renderItems array. This can be redefined but
			//		must not be called directly.
			// index: Number
			//		The index of the render item to update.
			// renderItem: Object
			//		The render item data the render item must be updated with.
			// renderItems: Array
			//		The array of render items to render item to be updated is part of.
			// tags:
			//		protected
			// we want to keep the same item object and mixin new values into old object
			dcl.mix(renderItems[index], renderItem);
		},

		itemMoved: function (previousIndex, newIndex, renderItem, renderItems) {
			// summary:
			//		This method is called when an item is moved in an observable store. The default 
			//		implementation actually moves the renderItem in the renderItems array. This can be redefined but
			//		must not be called directly.
			// previousIndex: Number
			//		The previous index of the render item.
			// newIndex: Number
			//		The new index of the render item.
			// renderItem: Object
			//		The render item to be moved.
			// renderItems: Array
			//		The array of render items to render item to be moved is part of.
			// tags:
			//		protected
			// we want to keep the same item object and mixin new values into old object
			this.itemRemoved(previousIndex, renderItems);
			this.itemAdded(newIndex, renderItem, renderItems);
		},

		_itemRemoved: function (event) {
			// summary:
			//		When the store is observed and an item is removed in the store this method is called to remove the
			//		corresponding render item. This can be redefined but must not be called directly.
			// event: Event
			//		The "remove" dstore/Observable event
			// tags:
			//		protected
			if (event.previousIndex !== undefined) {
				this.itemRemoved(event.previousIndex, this.renderItems);
				this.renderItems = this.renderItems;
			}
			// if no previousIndex the items is removed outside of the range we monitor so we don't care
		},

		_itemUpdated: function (event) {
			// summary:
			//		When the store is observed and an item is updated in the store this method is called to update the
			//		corresponding render item. This can be redefined but must not be called directly.
			// event: Event
			//		The "update" dstore/Observable event
			// tags:
			//		protected
			if (event.index === undefined) {
				// this is actually a remove
				this.itemRemoved(event.previousIndex, this.renderItems);
			} else if (event.previousIndex === undefined) {
				// this is actually a add
				this.itemAdded(event.index, this.itemToRenderItem(event.target), this.renderItems);
			} else if (event.index !== event.previousIndex) {
				// this is a move
				this.itemMoved(event.previousIndex, event.index, this.itemToRenderItem(event.target), this.renderItems);
			} else {
				// we want to keep the same item object and mixin new values into old object
				this.itemUpdated(event.index, this.itemToRenderItem(event.target), this.renderItems);
			}
			// set back the modified items property
			this.renderItems = this.renderItems;
		},

		_itemAdded: function (event) {
			// summary:
			//		When the store is observed and an item is added in the store this method is called to add the
			//		corresponding render item. This can be redefined but must not be called directly.
			// event: Event
			//		The "add" dstore/Observable event
			// tags:
			//		protected
			if (event.index !== undefined) {
				this.itemAdded(event.index, this.itemToRenderItem(event.target), this.renderItems);
				// set back the modified items property
				this.renderItems = this.renderItems;
			}
			// if no index the item is added outside of the range we monitor so we don't care
		}
	});
});
