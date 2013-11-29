define(["dcl/dcl", "dojo/_base/lang", "dojo/Deferred", "dojo/when", "./Container", "./hasLoad!delite-ViewController"],
	function (dcl, lang, Deferred, when, Container) {
	return dcl(Container, {
		// summary:
		//		Mixin for widgets containers that want to react to delite-display event.
		// description:
		//		By listening to delite-display event a container is able to be notified one of its child must be
		//		displayed. Before displaying it, it will fire the delite-display-load event giving a chance to a
		//		listener to load and create the child if not yet available before proceeding with the display.

		preCreate: function () {
			this.on("delite-display", lang.hitch(this, "deliteDisplayHandler"));
		},

		deliteDisplayHandler: function (event) {
			// summary:
			//		Handle the delite-display event for this container
			// tags:
			//		protected
			if (event.target === this && !event.defaultPrevented) {
				// we are on the target and we have not been prevented, let's proceed
				if (!event.hide) {
					event.loadDeferred = new Deferred();
					event.loadDeferred.then(lang.hitch(this, function (view) {
						// if view is not null this means we loaded a new view (div), add it
						if (view != null) {
							this.addChild(view.child, view.index);
						}
						when(this.performDisplay(event), function () {
							event.transitionDeferred.resolve();
						});
					}));
					this.emit("delite-display-load", event);
				}
			}
		},

		performDisplay: function (/*jshint unused: vars*/event) {
			// summary:
			//		This method must perform the display and possible transition effect. It is meant to be
			//		implemented by subclasses.
			// returns:
			//		A promise that will be resolved when the display & transition effect will have been performed.
			// tags:
			//		protected
			return true;
		}
	});
});