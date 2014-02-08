define([
	"dcl/advise",
	"dcl/dcl"
], function (advise, dcl) {

	// module:
	//		delite/Destroyable

	var Destroyable = dcl(null, {
		// summary:
		//		Mixin to track handles and release them when instance is destroyed.
		// description:
		//		Call this.own(...) on list of handles (returned from dojo/aspect, dojo/on,
		//		dojo/Stateful::watch, or any class (including widgets) with a destroy() or remove() method.
		//		Then call destroy() later to destroy this instance and release the resources.

		destroy: dcl.advise({
			before: function () { this._beingDestroyed = true; },
			after: function () { this._destroyed = true; }
		}),
		/*=====
		destroy: function () {
			// summary:
			//		Destroy this class, releasing any resources registered via own().
		},
		=====*/

		own: function () {
			// summary:
			//		Track specified handles and remove/destroy them when this instance is destroyed, unless they were
			//		already removed/destroyed manually.
			// tags:
			//		protected
			// returns:
			//		The array of specified handles, so you can do for example:
			//	|		var handle = this.own(on(...))[0];

			// transform arguments into an Array
			var ary = Array.prototype.slice.call(arguments);
			ary.forEach(function (handle) {
				var destroyMethodName = "destroy" in handle ? "destroy" : "remove";

				// When this.destroy() is called, destroy handle.  Since I'm using aspect.before(),
				// the handle will be destroyed before a subclass's destroy() method starts running.
				var odh = advise.before(this, "destroy", function (preserveDom) {
					handle[destroyMethodName](preserveDom);
				});

				// If handle is destroyed manually before this.destroy() is called,
				// remove the listener set directly above.
				var hdh = advise.after(handle, destroyMethodName, function () {
					odh.destroy();
					hdh.destroy();
				}, true);
			}, this);

			return ary;		// [handle]
		}
	});

	dcl.chainBefore(Destroyable, "destroy");

	return Destroyable;
});
