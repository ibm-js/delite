define(["dcl/dcl"
], function (dcl) {

	// Important: if the domNode height is not specified (css, style) and the domNode contains an image node,
	//			  either the height of the image should be specified in the img tag (<img height='...'>) or
	//			  the invalidateHeight method should be called when the image has been loaded.
	return dcl(null, {

		cacheMeasuredHeight: true,
		_measuredHeight: null,

		// the default implementation cache the value
		getHeight: function () {
			if (this._measuredHeight == null || !this.cacheMeasuredHeight) {
				var rect = this.getBoundingClientRect();
				this._measuredHeight = rect.bottom - rect.top;
			}
			return this._measuredHeight;
		},

		invalidateHeight: function () {
			this._measuredHeight = null;
		},

	});
});