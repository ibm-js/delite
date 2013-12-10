define(["dcl/dcl", "dojo/_base/lang", "dojo/Deferred", "dojo/when", "./Container", "./DisplayController"],
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
					event.loadDeferred.then(lang.hitch(this, function (value) {
						// if view is not already a child this means we loaded a new view (div), add it
						if (this.getIndexOfChild(value.child) === -1) {
							this.addChild(value.child, value.index);
						}
						when(this.performDisplay(value.child, event), function () {
							event.transitionDeferred.resolve(value);
						});
					}));
					this.emit("delite-display-load", event);
				}
			}
		},

		performDisplay: function (/*jshint unused: vars*/widget, event) {
			// summary:
			//		This method must perform the display and possible transition effect. It is meant to be
			//		specialized by subclasses.
			// returns:
			//		A promise that will be resolved when the display & transition effect will have been performed.
			// tags:
			//		protected
			widget.style.visibility = "visible";
			widget.style.display = "";
			return true;
		}
	});
});