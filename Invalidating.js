define(["dcl/dcl", "dojo/_base/lang", "./Stateful", "./Destroyable"], function (dcl, lang, Stateful, Destroyable) {

	return dcl([Stateful, Destroyable], {
		// summary:
		//		Mixin for classes (usually widgets) that watch a set of invalidating properties
		//		and delay to the next execution frame the refresh following the changes of
		//		the values of these properties. The receiving class must extend delite/Widget
		//		or dojo/Evented.
		// description:
		//		Once a set of properties have been declared subject to invalidation using the method
		//		addInvalidatingProperties(), changes of the values of these properties possibly
		//		end up calling refreshProperties() and in all cases refreshRendering(),
		//		thus allowing the receiving class to refresh itself based on the new values.

		_renderHandle: null,

		// _invalidatingProperties: [private] Object
		//		A hash of properties to watch in order to trigger the invalidation of these properties
		//		and/or the rendering invalidation.
		//		This list must be initialized by the time buildRendering() completes, usually in preCreate(),
		//		using addInvalidatingProperties(). Default value is null.
		_invalidatingProperties: null,
		
		// _invalidatedProperties: [private] Object
		//		A hash of invalidated properties either to refresh them or to refresh the rendering.
		_invalidatedProperties: null,
		
		// invalidProperties: Boolean
		//		Whether at least one property is invalid. This is readonly information, one must call
		//		invalidateProperties() to modify this flag.
		invalidProperties: false,
		
		// invalidRenderering: Boolean
		//		Whether the rendering is invalid. This is readonly information, one must call
		//		invalidateRendering() to modify this flag.
		invalidRendering: false,

		// if we are not a Widget, setup the listeners at construction time
		constructor: dcl.after(function () {
			this._initializeInvalidating();
		}),

		// if we are on a Widget, listen for any changes to properties after the widget has been rendered,
		// including when declarative properties (ex: iconClass=xyz) are applied.
		buildRendering: dcl.after(function () {
			// tags:
			//		protected
			this._initializeInvalidating();
		}),

		_initializeInvalidating: function () {
			if (this._invalidatingProperties) {
				var props = Object.keys(this._invalidatingProperties);
				for (var i = 0; i < props.length; i++) {
					this.watch(props[i], lang.hitch(this, this._invalidatingProperties[props[i]]));
				}
			}
			this._invalidatedProperties = {};
		},

		addInvalidatingProperties: function () {
			// summary:
			//		Adds the properties listed as arguments to the properties watched for triggering invalidation.
			// 		This method must be called during the startup lifecycle before buildRendering() completes,
			//		usually in preCreate().
			// description:
			//		This can be used to trigger invalidation for rendering or for both property and rendering. When
			//		no invalidation mechanism is specified, only the rendering refresh will be triggered, that is only
			//		the refreshRendering() method will be called.
			//		This method can either be called with a list of properties to invalidate the rendering as follows:
			//			this.addInvalidatingProperties("foo", "bar", ...);
			//		or with an hash of keys/values, the keys being the properties to invalidate and the values
			//		being the invalidation method (either rendering or property and rendering):
			//			this.addInvalidatingProperties({
			//				"foo": "invalidateProperty",
			//				"bar": "invalidateRendering"
			//			});
			// tags:
			//		protected
			if (this._invalidatingProperties == null) {
				this._invalidatingProperties = {};
			}
			for (var i = 0; i < arguments.length; i++) {
				if (typeof arguments[i] === "string") {
					// we just want the rendering to be refreshed
					this._invalidatingProperties[arguments[i]] = "invalidateRendering";
				} else {
					// we just merge key/value objects into our list of invalidating properties
					var props = Object.keys(arguments[i]);
					for (var j = 0; j < props.length; j++) {
						this._invalidatingProperties[props[j]] = arguments[i][props[j]];
					}
				}
			}
		},
		
		invalidateProperty: function (name) {
			// summary:
			//		Invalidates the property for the next execution frame.
			// name: String?
			//		The name of the property to invalidate. If absent, the revalidation
			//		is performed without a particular property being invalidated, that is
			//		the argument passed to refreshProperties() does not contain is called without any argument.
			// tags:
			//		protected
			if (name) {
				this._invalidatedProperties[name] = true;
			}
			if (!this.invalidProperties) {
				this.invalidProperties = true;
				// if we have a pending render, let's cancel it to execute it post properties refresh
				if (this._renderHandle) {
					this._renderHandle.remove();
					this.invalidRendering = false;
					this._renderHandle = null;
				}
				this.defer(this.validateProperties, 0);
			}
		},
		
		invalidateRendering: function (name) {
			// summary:
			//		Invalidates the rendering for the next execution frame.
			// name: String?
			//		The name of the property to invalidate. If absent then the revalidation is asked without a
			//		particular property being invalidated, that is refreshRendering() is called without
			//		any argument.
			// tags:
			//		protected
			if (name) {
				this._invalidatedProperties[name] = true;
			}
			if (!this.invalidRendering) {
				this.invalidRendering = true;
				this._renderHandle = this.defer(this.validateRendering, 0);
			}
		},
		
		validateProperties: function () {
			// summary:
			//		Immediately validates the properties.
			// description:
			//		Does nothing if no invalidating property is invalid.
			//		You generally do not call that method yourself.
			// tags:
			//		protected
			if (this.invalidProperties) {
				var props = lang.clone(this._invalidatedProperties);
				this.invalidProperties = false;
				this.refreshProperties(this._invalidatedProperties);
				this.emit("refresh-properties-complete",
					{ invalidatedProperties: props, bubbles: true, cancelable: false });
				// if there are properties still marked invalid pursue further with rendering refresh
				this.invalidateRendering();
			}
		},
		
		validateRendering: function () {
			// summary:
			//		Immediately validates the rendering.
			// description:
			//		Does nothing if the rendering is not invalid.
			//		You generally do not call that method yourself.
			// tags:
			//		protected
			if (this.invalidRendering) {
				var props = lang.clone(this._invalidatedProperties);
				this.invalidRendering = false;
				this.refreshRendering(this._invalidatedProperties);
				// do not fully delete invalidateProperties because someone might have set a property in
				// its refreshRendering method (not wise but who knows what people are doing) and a new cycle
				// should start with that properties listed as invalid instead of a blank set of properties
				for (var key in props) {
					delete this._invalidatedProperties[key];
				}
				this.emit("refresh-rendering-complete",
					{ invalidatedProperties: props, bubbles: true, cancelable: false });
			}
		},
		
		validate: function () {
			// summary:
			//		Immediately validates the properties and the rendering.
			// description:
			//		The method calls validateProperties() then validateRendering().
			//		You generally do not call that method yourself.
			// tags:
			//		protected
			this.validateProperties();
			this.validateRendering();
		},
		
		refreshProperties: function (/*jshint unused: vars */props) {
			// summary:
			//		Actually refreshes the properties. 
			// description:
			//		The default implementation does nothing. A class using this mixin
			//		should implement this method if it needs to react to changes
			//		of the value of an invalidating property, except for modifying the
			//		DOM in which case refreshRendering() should be used instead.
			//		Typically, this method should be overriden for implementing
			//		the reconciliation of properties, for instance for adjusting 
			//		interdependent properties such as "min", "max", and "value". 
			//		The mixin calls this method before refreshRendering().
			// props: Object
			//		A hash of invalidated properties. This hash will then be passed further down to the
			//		refreshRendering() method. As such any modification to this hash will be 
			//		visible in refreshRendering().
			// tags:
			//		protected
		},
		
		refreshRendering: function (/*jshint unused: vars */props) {
			// summary:
			//		Actually refreshes the rendering.
			// description:
			//		The default implementation does nothing. A class using this mixin
			//		should implement this method if it needs to modify the DOM in reaction 
			//		to changes of the value of invalidating properties.
			//		The mixin calls this method after refreshProperties().
			// props: Object
			//		A hash of invalidated properties.
			// tags:
			//		protected
		}
	});
});
