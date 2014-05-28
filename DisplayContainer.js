/** @module delite/DisplayContainer */
define(["dcl/dcl", "dojo/on", "dojo/Deferred", "dojo/when", "delite/Container"],
	function (dcl, on, Deferred, when, Container) {
	/**
	 * Mixin for widget containers that need to show on or off a child.
	 * 
	 * When the show method is called a container extending this mixin is able to be notified that one of
	 * its children must be displayed. Before displaying it, it will fire the delite-display-load event
	 * giving a chance to a listener to load and create the child if not yet available before proceeding with
	 * the display. After the display has been performed a delite-display-complete event will be fired.
	 * @mixin module:delite/DisplayContainer
	 * @augments {module:delite/Container}
	 */
	return dcl(Container, /** @lends module:delite/DisplayContainer# */ {
		/**
		 * This method must be called to display a particular destination child on this container.
		 * @param {HTMLElement|string} dest Widget or HTMLElement or id that points to the child this container must 
		 * display.
		 * @param {Object} [params] Optional params that might be taken into account when displaying the child. 
		 * This can be the type of visual transitions involved. This might vary from one DisplayContainer to another.
		 * @returns {Promise} A promise that will be resolved when the display & transition effect will have been
		 * performed.
		 */
		show: function (dest, params) {
			// we need to warn potential app controller we are going to load a view & transition
			var event = {
				dest: dest,
				loadDeferred: new Deferred(),
				bubbles: true,
				cancelable: true
			};
			var self = this, displayDeferred = new Deferred();
			dcl.mix(event, params);
			// we now need to warn potential app controller we need to load a new child
			// when the controller told us it will handle child loading use the deferred from the event
			// otherwise call the container load method
			// we should probably be using event.defaultPrevented here but dojo/on does not return the native event
			// when it has been prevented but false value instead...
			var loadDeferred = on.emit(this, "delite-display-load", event) ? this.load(dest) : event.loadDeferred;
			when(loadDeferred, function (value) {
				// if view is not already a child this means we loaded a new view (div), add it
				if (self.getIndexOfChild(value.child) === -1) {
					self.addChild(value.child, value.index);
				}
				// the child is here, actually perform the display
				// notify everyone we are going to proceed
				event = {
					dest: dest,
					bubbles: true,
					cancelable: false
				};
				dcl.mix(event, params);
				dcl.mix(event, value);
				self.emit("delite-before-show", event);
				when(self.changeDisplay(value.child, event), function () {
					self.emit("delite-after-show", event);
					displayDeferred.resolve(value);
				});
			});
			return displayDeferred.promise;
		},

		/**
		 * This method must be called to hide a particular destination child on this container.
		 * @param {HTMLElement|string} dest Widget or HTMLElement or id that points to the child this container must 
		 * hide.
		 * @param {Object} [params] Optional params that might be taken into account when removing the child. This can 
		 * be the type of visual transitions involved. This might vary from one DisplayContainer to another.
		 * @returns {Promise} A promise that will be resolved when the display & transition effect will have been
		 * performed.
		 */
		hide: function (dest, params) {
			// we need to warn potential app controller we are going to load a view & transition
			var event = {
				dest: dest,
				loadDeferred: new Deferred(),
				bubbles: true,
				cancelable: true,
				hide: true
			};
			var self = this, displayDeferred = new Deferred();
			dcl.mix(event, params);
			// we now need to warn potential app controller we need to load a child (this is needed to be able to 
			// get a hand on it)
			// when the controller told us it will handle child loading use the deferred from the event
			// otherwise call the container load method
			// we should probably be using event.defaultPrevented here but dojo/on does not return the native event
			// when it has been prevented but false value instead...
			var loadDeferred = on.emit(this, "delite-display-load", event) ? this.load(dest) : event.loadDeferred;
			when(loadDeferred, function (value) {
				// the child is here, actually perform the display
				// notify everyone we are going to proceed
				event = {
					dest: dest,
					bubbles: true,
					cancelable: false,
					hide: true
				};
				dcl.mix(event, params);
				dcl.mix(event, value);
				self.emit("delite-before-hide", event);
				when(self.changeDisplay(value.child, event), function () {
					// if view is not already removed, remove it
					if (self.getIndexOfChild(value.child) !== -1) {
						self.removeChild(value.child);
					}
					self.emit("delite-after-hide", event);
					displayDeferred.resolve(value);
				});
			});
			return displayDeferred.promise;
		},

		/**
		 * This method must perform the display and possible transition effect. It is meant to be specialized by 
		 * subclasses.
		 * @param {HTMLElement|string} widget Widget or HTMLElement or id that points to the child this container must
		 * show or hide.
		 * @param {Object} [params] Optional params that might be taken into account when displaying the child. This 
		 * can be the type of visual transitions involved. This might vary from one DisplayContainer to another.
		 * By default on the "hide" param is supporting meaning that the transition should hide the widget
		 * not display it.
		 * @returns {Promise} Optionally a promise that will be resolved when the display & transition effect will have
		 * been performed.
		 */
		changeDisplay: function (widget, /*jshint unused: vars*/params) {
			if (params.hide === true) {
				widget.style.visibility = "hidden";
				widget.style.display = "none";
			} else {
				widget.style.visibility = "visible";
				widget.style.display = "";
			}
		},

		/**
		 * This method can be redefined to load a child of the container. By default it just looks up
		 * elements by id.
		 * @protected
		 * @param {HTMLElement|string} widget Widget or HTMLElement or id that points to the child this container must 
		 * display.
		 * @returns {Promise|object} If asynchronous a promise that will be resolved when the child will have been 
		 * loaded with an object of the following form: { child: widget } or with an optional index
		 * { child: widget, index: index }. Other properties might be added to	the object if needed.
		 * If the action is synchronous this directly returns the given object.
		 */
		load: function (dest) {
			return { child: typeof dest === "string" ? this.ownerDocument.getElementById(dest) : dest };
		}
	});
});