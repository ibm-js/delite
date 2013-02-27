define(["dojo/_base/declare", "dojo/_base/lang", "dojo/Stateful", "dojo/when"],
	function(declare, lang, Stateful, when){

	return declare(Stateful, {

		// summary:
		//		This mixin contains the store management.

		// store: dojo.store.Store
		//		The store that contains the events to display.
		store: null,

		// query: Object
		//		A query that can be passed to when querying the store.
		query: {},

		// queryOptions: dojo/store/api/Store.QueryOptions?
		//		Options to be applied when querying the store.
		queryOptions: null,

		itemToRenderItem: function(item, store){
			// summary:
			//		Returns the widget internal item for a give store item. By default it returns the store item itself.
			// item: Object
			//		The store item.
			// store: dojo/store/api/Store
			//		The store the item is coming from
			// tags:
			//		protected
			return item;
		},

		_initItems: function(items){
			// tags:
			//		private
			this.set("items", items);
			return items;
		},

		_setStoreAttr: function(value){
			// tags:
			//		private
			var r;
			if(this._observeHandler){
				this._observeHandler.remove();
				this._observeHandler = null;
			}
			if(value != null){
				var results = value.query(this.query, this.queryOptions);
				if(results.observe){
					// user asked us to observe the store
					this._observeHandler = results.observe(lang.hitch(this, this._updateItem), true);
				}
				// if we have a mapping function between data item and some intermediary items use it
				results = results.map(lang.hitch(this, function(item){
					return this.itemToRenderItem(item, value);
				}));
				r = when(results, lang.hitch(this, this._initItems));
			}else{
				r = this._initItems([]);
			}
			this._set("store", value);
			return r;
		},

		_updateItem: function(object, previousIndex, newIndex){
			// tags:
			//		private

			var items = this.get("items");

			// if we have a mapping function between data item and some intermediary items use it
			var newItem = this.itemToRenderItem(object, this.store);

			if(previousIndex != -1){
				// this is a remove or a move
				if(newIndex != previousIndex){
					// remove
					this.removeItem(previousIndex, newItem, items);
				}else{
					// this is a put, previous and new index identical
					this.putItem(previousIndex, newItem, items);
				}
			}else if(newIndex != -1){
				// this is a add
				this.addItem(newIndex, newItem, items);

			}
			// set back the modified items property
			this.set("items", items);
		},

		removeItem: function(index, item, items){
			// summary:
			//		Remove a widget internal item. This can be redefined but must not be called directly.
			// index: Number
			//		The index of the removed item.
			// item: Object
			//		The removed item.
			// items: Array
			//		The array of items to remove the item from.
			// tags:
			//		protected
			items.splice(index, 1);
		},

		putItem: function(index, item, items){
			// summary:
			//		Modify a widget internal item. This can be redefined but must not be called directly.
			// index: Number
			//		The index of the modified item.
			// item: Object
			//		The modified item.
			// items: Array
			//		The array of items in which the modified item is.
			// tags:
			//		protected

			// we want to keep the same item object and mixin new values into old object
			lang.mixin(items[previousIndex], item);
		},

		addItem: function(index, item, items){
			// summary:
			//		Add a widget internal item. This can be redefined but must not be called directly.
			// index: Number
			//		The index of the added item.
			// item: Object
			//		The added item.
			// items: Array
			//		The array of items in which to add the item.
			// tags:
			//		protected
			items.splice(index, 0, item);
		}
	});
});
