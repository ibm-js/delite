/** @module delite/ArrayQueryAdapter */
define([
	"dcl/dcl",
	"ibm-decor/Evented"
], function (dcl, Evented) {

	/**
	 * Returns a thenable on some static data, but unlike Promise, it executes synchronously.
	 */
	function syncThenable (data) {
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
		declaredClass: "delite/ArrayQueryAdapter",

		constructor: function (args) {
			this.source = args.source;
			this._isQueried = this._compileQuery(args.query);
			this.data = args.processQueryResult(this.source.filter(this._isQueried));
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
				var evt = {
					start: args.start,
					end: args.end,
					resLength: res.length,
					setPromise: function (pro) {
						promise = pro;
					}
				};
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
