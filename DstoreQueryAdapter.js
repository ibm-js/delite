/** @module delite/DstoreQueryAdapter */
define([
	"dcl/dcl"
], function (dcl) {

	/**
	 * An adapter to use dstore/Store in the `source` of delite/Store.js.
	 * Created to keep a common interface with the use of an array instead of dstore/Store.
	 * The arguments to pass to the constructor are:
	 *
	 * - source: dstore/Store - the dstore/Store represented by the adapter.
	 * - query: the query filter to apply to the store.
	 * - processQueryResult: function to apply to the store.
	 *
	 * @class module:delite/DstoreQueryAdapter
	 */
	return dcl(null, /** @lends module:delite/DstoreQueryAdapter# */ {
		constructor: function (args) {
			this.source = args.source;
			this.data = args.processQueryResult(this.source.filter(args.query));
			if (this.data.track) {
				this.data = this._tracked = this.data.track();
				this.track = true;
			}
		},

		/**
		 * Indicates if the source is trackable.
		 * @member {boolean}
		 * @default false
		 * @readonly
		 */
		track: false,

		/**
		 * Remove the trackability of the dstore.
		 */
		untrack: function () {
			if (this._tracked) {
				this._tracked.tracking.remove();
				this._tracked = null;
			}
		},

		/**
		 * Perform the fetch operation on the collection.
		 */
		fetch: function () {
			return this.data.fetch();
		},

		/**
		 * Perform the fetchRange operation on the collection.
		 * @param {Object} args - contains the start index and the end index of the fetch.
		 */
		fetchRange: function (args) {
			return this.data.fetchRange(args);
		},

		/**
		 * Bind the listener of the adapter with the events send by the dstore/Trackable.
		 * @param type
		 * @param listener
		 * @returns {Object} Handle with `remove()` method to cancel the listener.
		 */
		on: function (type, listener) {
			return this.data.on(type, listener);
		},

		/**
		 * Set the identity of an object.
		 */
		setIdentity: function (item, id) {
			this.source._setIdentity(item, id);
		},

		/**
		 * Retrieve an object in the data by its identity.
		 */
		get: function (id) {
			return this.source.get(id);
		},

		/**
		 * Return the identity of an item.
		 * @param {Object} item - The item.
		 * @returns {*}
		 * @protected
		 */
		getIdentity: function (item) {
			return this.source.getIdentity(item);
		}
	});
});
