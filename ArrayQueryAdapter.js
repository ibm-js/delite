/** @module delite/ArrayQueryAdapter */
define([
	"dcl/dcl",
	"decor/Evented",
	"decor/ObservableArray",
	"decor/Observable",
	"requirejs-dplugins/Promise!"
], function (dcl, Evented, ObservableArray, Observable, Promise) {

	/**
	 * Returns a thenable on some static data, but unlike Promise, it executes synchronously.
	 */
	function syncThenable(data) {
		return {
			then: function (resolve) {
				var res = resolve(data);
				return res && res.then ? res : syncThenable(res);
			}
		};
	}

	/**
	 * An adapter to use an array in the source of delite/Store.js.
	 * Created to keep a common interface with the use of dstore/Store instead of an array.
	 *
	 * The arguments to pass to the constructor are:
	 *
	 * - source: Array - the array represented by the adapter.
	 * - query: the query filter to apply to the source.
	 * - processQueryResult: function to apply to the source
	 *
	 * @class module:delite/ArrayQueryAdapter
	 */
	return dcl(Evented, /** @lends module:delite/ArrayQueryAdapter# */ {
		constructor: function (args) {
			this.source = args.source;
			// affect the callbacks of the observe functions
			this._itemHandles = [];
			this._observeCallbackArray = this.__observeCallbackArray.bind(this);
			this._observeCallbackItems = this.__observeCallbackItems.bind(this);
			for (var i = 0; i < this.source.length; i++) {
				// affect the callback to the observe function if the item is observable
				this._itemHandles[i] = Observable.observe(this.source[i], this._observeCallbackItems);
			}
			// affect the callback to the observe function if the array is observable
			this._arrayHandle = ObservableArray.observe(this.source, this._observeCallbackArray);
			this._isQueried = this._compileQuery(args.query);
			this.data = args.processQueryResult(this.source.filter(this._isQueried));
			if (this._arrayHandle || this._itemHandles) {
				this.track = true;
			}
		},

		/**
		 * Indicates if the source is observable.
		 * @member {boolean}
		 * @default false
		 * @readonly
		 */
		track: false,

		/////////////////////////////////////////////////////////////////
		// Functions dedicated to the Observability of the source
		/////////////////////////////////////////////////////////////////

		/**
		 * Function to add an item in the data and pass the good event to the function `itemAdded()` of `delite/Store`.
		 * @param evt
		 * @returns {{index: *, target: (*|evtUpdated.obj|evtRemoved.obj|evtAdded.obj|host.obj|obj)}}
		 * @private
		 */
		_addItemToCollection: function (evt) {
			var i = evt.index - 1;
			while (!this._isQueried(this.source[i])) {
				i--;
			}
			var idx = this.data.indexOf(this.source[i]);
			this.data.splice(idx + 1, 0, evt.obj);
			return {index: idx + 1, target: evt.obj};
		},

		/**
		 * Function to remove an item from the data and pass the good event to the function `itemRemoved()`
		 * of `delite/Store`.
		 * @param evt
		 * @returns {{previousIndex: (*|number|Number)}}
		 * @private
		 */
		_removeItemFromCollection: function (evt) {
			var idx = this.data.indexOf(evt.obj);
			this.data.splice(idx, 1);
			return {previousIndex: idx};
		},

		/**
		 * Function to test if the update was finally a remove or an add to the data.
		 * @param evt
		 * @param idx
		 * @returns {boolean}
		 * @private
		 */
		_isAnUpdate: function (evt, idx) {
			return this._isQueried(evt.obj) && idx >= 0;
		},

		/**
		 * Function that emit an event "add" if the update was finally an "add" and an event "remove" if it was a
		 * remove.
		 * @param evt
		 * @param idx
		 * @private
		 */
		_redirectEvt: function (evt, idx) {
			if (this._isQueried(evt.obj) && idx < 0) {
				var evtAdded = this._addItemToCollection(evt);
				this.emit("add", evtAdded);
			} else if (!this._isQueried(evt.obj) && idx >= 0) {
				var evtRemoved = this._removeItemFromCollection(evt);
				this.emit("delete", evtRemoved);
			}
		},

		/**
		 * Function to pass the good event to the function `itemUpdated()` of `delite/Store`.
		 * @param evt
		 * @param idx
		 * @returns {{index: *, previousIndex: *, target: (*|evtUpdated.obj|evtRemoved.obj|evtAdded.obj|host.obj|obj)}}
		 * @private
		 */
		_updateItemInCollection: function (evt, idx) {
			return {index: idx, previousIndex: idx, target: evt.obj};
		},

		/**
		 * Called when a modification is done on the array.
		 * @param {Array} changeRecords - sent by the Observe function.
		 */
		__observeCallbackArray: function (changeRecords) {
			if (!this._beingDiscarded) {
				for (var i = 0; i < changeRecords.length; i++) {
					if (changeRecords[i].type === "splice") {
						var j, evt;
						for (j = 0; j < changeRecords[i].removed.length; j++) {
							this._itemHandles[changeRecords[i].index].remove();
							this._itemHandles.splice(changeRecords[i].index, 1);
							var evtRemoved = {previousIndex: changeRecords[i].index,
								obj: changeRecords[i].removed[j]};
							if (this._isQueried(evtRemoved.obj)) {
								evt = this._removeItemFromCollection(evtRemoved);
								this.emit("delete", evt);
							}
						}
						for (j = 0; j < changeRecords[i].addedCount; j++) {
							var evtAdded = {
								index: changeRecords[i].index + j,
								obj: this.source[changeRecords[i].index + j]
							};
							if (this.renderItems !== null && this.renderItems !== undefined) {
								evtAdded.index = evtAdded.index <= this.renderItems.length ?
									evtAdded.index : this.renderItems.length;
							}
							// affect the callback to the observe function if the item is observable
							this._itemHandles.splice(changeRecords[i].index + j, 0,
								Observable.observe(
									this.source[changeRecords[i].index + j], this._observeCallbackItems)
							);
							if (this._isQueried(evtAdded.obj)) {
								evt = this._addItemToCollection(evtAdded);
								this.emit("add", evt);
							}
						}
					}
				}
			}
		},

		/**
		 * Called when a modification is done on the items.
		 * @param {Array} changeRecords - sent by the Observe function.
		 */
		__observeCallbackItems: function (changeRecords) {
			if (!this._beingDiscarded) {
				var objects = [];
				for (var i = 0; i < changeRecords.length; i++) {
					var object = changeRecords[i].object;
					if (objects.indexOf(object) < 0) {
						objects.push(object);
						if (changeRecords[i].type === "add" || changeRecords[i].type === "update" ||
							changeRecords[i].type === "delete" || changeRecords[i].type === "splice") {
							var evtUpdated = {
								index: this.source.indexOf(object),
								previousIndex: this.source.indexOf(object),
								obj: object,
								oldValue: changeRecords[i].oldValue,
								name: changeRecords[i].name
							};
							var idx = this.data.indexOf(evtUpdated.obj);
							if (!this._isAnUpdate(evtUpdated, idx)) {
								this._redirectEvt(evtUpdated, idx);
							} else {
								var evt = this._updateItemInCollection(evtUpdated, idx);
								this.emit("update", evt);
							}
						}
					}
				}
			}
		},

		/**
		 * Generate a function that will test if an item respects the query conditions.
		 * @param query
		 * @returns {Function}
		 * @private
		 */
		_compileQuery: function (query) {
			if (Object.getOwnPropertyNames(query).length !== 0) {
				if (typeof query === "function") {
					return query;
				}
				if (!query.type) {
					return function (item) {
						for (var property in query) {
							if (item[property] !== query[property]) { return false; }
						}
						return true;
					};
				}
				return this._compileFilterQuery(query);
			} else {
				return function () { return true; };
			}
		},

		/**
		 * Generate a function that will test if an item respects the query conditions, based on a query
		 * object generated from `dstore/Filter`.
		 * @param query
		 * @returns {Function}
		 * @private
		 */
		/* jshint maxcomplexity: 12 */
		_compileFilterQuery: function (query) {
			var prop = query.args[0];
			var value = query.args[1];
			switch (query.type) {
			case "eq":
				return function (item) {return item[prop] === value; };
			case "ne":
				return function (item) {return item[prop] !== value; };
			case "lt":
				return function (item) {return item[prop] < value; };
			case "lte":
				return function (item) {return item[prop] <= value; };
			case "gt":
				return function (item) {return item[prop] > value; };
			case "gte":
				return function (item) {return item[prop] >= value; };
			case "in":
				return function (item) {return value.indexOf(item[prop]) !== -1; };
			case "match":
				return function (item) {return value.test(item[prop]); };
			case "contains":
				return function (item) {return this._arrayContains(item[prop], value); }.bind(this);
			/**
			 * In the case of "and" and "or" the prop in in fact the first member of the two queries and value the
			 * second member.
			 */
			case "and":
				var f1 = this._compileFilterQuery(prop);
				var f2 = this._compileFilterQuery(value);
				return function (item) {return f1(item) && f2(item); };
			case "or":
				f1 = this._compileFilterQuery(prop);
				f2 = this._compileFilterQuery(value);
				return function (item) {return f1(item) || f2(item); };
			default:
				throw new Error("Unknown filter operation '" + query.type + "'");
			}
		},
		/* jshint maxcomplexity: 10*/

		/**
		 * Test if an array contains all the values in parameter values.
		 * @param array
		 * @param values
		 * @returns {boolean}
		 * @private
		 */
		_arrayContains: function (array, values) {
			for (var j = 0; j < values.length; j++) {
				if (array.indexOf(values[j]) === -1) {
					return false;
				}
			}
			return true;
		},

		/**
		 * Synchronously emit add/update/delete events for all recent changes.
		 */
		deliver: function () {
			if (this._arrayHandle) {
				this._arrayHandle.deliver();
			}
			if (this._itemHandles.length !== 0) {
				this._observeCallbackItems && Observable.deliverChangeRecords(this._observeCallbackItems);
			}
		},

		/**
		 * Discard recent change records.
		 */
		discardChanges: function () {
			if (this._arrayHandle && this._itemHandles) {
				this._beingDiscarded = true;
				this._arrayHandle.deliver();
				this._observeCallbackItems && Observable.deliverChangeRecords(this._observeCallbackItems);
				this._beingDiscarded = false;
				return this;
			}
		},

		/**
		 * Stop observing the array and its items.
		 */
		untrack: function () {
			if (this._arrayHandle) {
				this._arrayHandle.remove();
			}
			if (this._itemHandles) {
				for (var i = 0; i < this._itemHandles.length; i++) {
					this._itemHandles[i].remove();
				}
			}
		},


		/////////////////////////////////////////////////////////////////////////
		// Functions dedicated to reproduce the behaviour of dstore functions
		/////////////////////////////////////////////////////////////////////////

		/**
		 * Perform the fetch operation on the collection.
		 */
		fetch: function () {
			return syncThenable(this.data);
		},

		/**
		 * Perform the fetchRange operation on the collection.
		 * @param {Object} args - contains the start index and the end index of the fetch.
		 */
		fetchRange: function (args) {
			var res = this.data.slice(args.start, args.end);
			if (res.length < (args.end - args.start)) {
				var promise;
				var evt = {start: args.start, end: args.end, resLength: res.length, setPromise: function (pro) {
					promise = pro;
				}};
				this.emit("_new-query-asked", evt);
				return promise || syncThenable(res);
			} else {
				return syncThenable(res);
			}
		},

		/**
		 * Set the identity of an object.
		 */
		setIdentity: function (item, id) {
			item.id = id;
		},

		/**
		 * Retrieve an object in the data by its identity.
		 */
		get: function (id) {
			for (var i = 0; i < this.data.length; i++) {
				var res = this.data[i];
				if (res.id === id) {
					return Promise.resolve(res);
				}
			}
		},

		/**
		 * Returns the identity of an item.
		 * @param {Object} item - The item.
		 * @returns {*}
		 */
		getIdentity: function (item) {
			return item.id !== undefined ? item.id : this.data.indexOf(item);
		}
	});
});
