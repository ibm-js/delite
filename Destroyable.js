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
			before: function () {
				this._beingDestroyed = true;
			},
			after: function () {
				this._destroyed = true;
			}
		}),

		/**
		 * Track specified handles and remove/destroy them when this instance is destroyed, unless they were
		 * already removed/destroyed manually.
		 * @returns {Object[]} The array of specified handles, so you can do for example:
		 * `var handle = this.own(on(...))[0];`
		 * @protected
		 */
		own: function () {
			var cleanupMethods = [
				"destroy",
				"remove"
			];

			// transform arguments into an Array
			var ary = Array.prototype.slice.call(arguments);
			ary.forEach(function (handle) {
				// When this.destroy() is called, destroy handle.  Since I'm using advise.before(),
				// the handle will be destroyed before a subclass's destroy() method starts running, before it calls
				// this.inherited() or even if it doesn't call this.inherited() at all.  If that's an issue, make an
				// onDestroy() method and connect to that instead.
				var destroyMethodName;
				var odh = advise.before(this, "destroy", function () {
					handle[destroyMethodName]();
				});

				// Callback for when handle is manually destroyed.
				var hdhs = [];

				function onManualDestroy() {
					odh.destroy();
					hdhs.forEach(function (hdh) {
						hdh.destroy();
					});
				}

				// Setup listeners for manual destroy of handle.
				// Also computes destroyMethodName, used in listener above.
				if (handle.then) {
					// Special path for Promises.  Detect when Promise is resolved, rejected, or
					// canceled (nb: cancelling a Promise causes it to be rejected).
					destroyMethodName = "cancel";
					handle.then(onManualDestroy, onManualDestroy);
				} else {
					// Path for other handles.  Just use AOP to detect when handle is manually destroyed.
					cleanupMethods.forEach(function (cleanupMethod) {
						if (typeof handle[cleanupMethod] === "function") {
							if (!destroyMethodName) {
								// Use first matching method name in above listener.
								destroyMethodName = cleanupMethod;
							}
							hdhs.push(advise.after(handle, cleanupMethod, onManualDestroy));
						}
					});
				}
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
