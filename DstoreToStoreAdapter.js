/** @module delite/DstoreToStoreAdapter */
define([
	"dcl/dcl"
], function (dcl) {

	/**
	 * An adapter to use dstore/Store in the source of delite/Store.js.
	 * Created to keep a commun interface with the use of an array instead of dstore/Store.
	 * @class module:delite/DstoreToStoreAdapter
	 *
	 * The arguments to pass to the constructor are :
	 *   source: dstore/Store - the dstore/Store represented by the adapter.
	 *   query: the query filter to apply to the store.
	 *   processQueryResult: function to apply to the store.
	 */
	return dcl(null, /** @lends module:delite/DstoreToStoreAdapter# */{
		constructor: function (args) {
			this.source = args.source;
			this.data = args.processQueryResult(this.source.filter(args.query));
			if (this.data.track) {
				this.data = this._tracked = this.data.track();
				this.track = true;
			}
		},

		/**
		 * Variable to indicate if the source is trackable.
		 * @member: boolean
		 * @default null
		 */
		track: null,

		/**
		 * Function to remove the trackability of the dstore.
		 * @private
		 */
		untrack: function () {
			if (this._tracked) {
				this._tracked.tracking.remove();
				this._tracked = null;
			}
		},

		/**
		 * Called to perform the fetch operation on the collection.
		 */
		fetch: function () {
			return this.data.fetch();
		},

		/**
		 * Called to perform the fetchRange operation on the collection.
		 * @param {args} - contains the start index and the end index of the fetch.
		 */
		fetchRange: function (args) {
			return this.data.fetchRange(args);
		},

		/**
		 * Created to bind the listener of the adapter with the events send by the dstore/Trackable.
		 * @param type
		 * @param listener
		 * @returns {*}
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
		 * Retrieves an object in the data by its identity.
		 */
		get: function (id) {
			return this.source.get(id);
		},

		/**
		 * Returns the identity of an item.
		 * @param {Object} item The item.
		 * @returns {Object}
		 * @protected
		 */
		getIdentity: function (item) {
			return this.source.getIdentity(item);
		}
	});
});
