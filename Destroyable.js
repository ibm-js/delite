/** @module delite/Destroyable */
define([
	"dcl/advise",
	"dcl/dcl"
], function (advise, dcl) {
	/**
	 * Mixin to track handles and release them when instance is destroyed.
	 *
	 * Call `this.own(...)` on list of handles (returned from dcl/advise, dojo/on,
	 * delite/Stateful#watch, or any class (including widgets) with a destroy() or remove() method.
	 * Then call `destroy()` later to destroy this instance and release the resources.
	 * @mixin module:delite/Destroyable
	 */
	var Destroyable = dcl(null, /** @lends module:delite/Destroyable# */ {
		/**
		 * Destroy this class, releasing any resources registered via `own()`.
		 * @method
		 */
		destroy: dcl.advise({
			before: function () { this._beingDestroyed = true; },
			after: function () { this._destroyed = true; }
		}),

		/**
		 * Track specified handles and remove/destroy them when this instance is destroyed, unless they were
		 * already removed/destroyed manually.
		 * @returns {Object[]} The array of specified handles, so you can do for example:
		 * `var handle = this.own(on(...))[0];`
		 * @protected
		 */
		own: function () {
			// transform arguments into an Array
			var ary = Array.prototype.slice.call(arguments);
			ary.forEach(function (handle) {
				var destroyMethodName = "destroy" in handle ? "destroy" : "remove";

				// When this.destroy() is called, destroy handle.  Since I'm using aspect.before(),
				// the handle will be destroyed before a subclass's destroy() method starts running.
				var odh = advise.before(this, "destroy", function () {
					handle[destroyMethodName]();
				});

				// If handle is destroyed manually before this.destroy() is called,
				// remove the listener set directly above.
				var hdh = advise.after(handle, destroyMethodName, function () {
					odh.destroy();
					hdh.destroy();
				});
			}, this);

			return ary;
		},

		/**
		 * Wrapper to setTimeout to avoid deferred functions executing
		 * after the originating widget has been destroyed.
		 * @param {Function} fcn - Function to be executed after specified delay (or 0ms if no delay specified).
		 * @param {number} delay - Delay in ms, defaults to 0.
		 * @returns {Object} Handle with a remove method that deschedules the callback from being called.
		 * @protected
		 */
		defer: function (fcn, delay) {
			var timer = setTimeout(
				function () {
					if (!timer) {
						return;
					}
					timer = null;
					if (!this._destroyed) {
						fcn.call(this);
					}
				}.bind(this),
					delay || 0
			);
			return {
				remove: function () {
					if (timer) {
						clearTimeout(timer);
						timer = null;
					}
					return null; // so this works well: handle = handle.remove();
				}
			};
		}
	});

	dcl.chainBefore(Destroyable, "destroy");

	return Destroyable;
});
