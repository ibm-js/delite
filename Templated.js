/** @module delite/Templated */
define([
	"dcl/dcl",
	"./Widget",
	"./handlebars"
], function (dcl, Widget, handlebars) {
	// Cache of compiled templates
	var cache = {};

	/**
	 * Superclass for widgets that use handlebars templates.
	 *
	 * ```js
	 * define([..., "delite/Templated", "delite/handlebars!./templates/MyTemplate.html"],
	 *			function(..., Templated, template){
	 *     register("my-widget", [HTMLElement, Templated], {
	 *         template: template
	 *     });
	 * });
	 * ```
	 *
	 * The `template` property can also be specified as a string:
	 *
	 * ```js
	 * define([..., "delite/Templated"],
	 *			function(..., Templated){
	 *     register("my-widget", [HTMLElement, Templated], {
	 *         template: "<template>hello world</template>"
	 *     });
	 * });
	 * ```
	 *
	 * However, the first form is preferred for speed and build size.
	 *
	 * Templates have a format like:
	 *
	 * ```html
	 * <button>
	 *   <span class="d-reset {{iconClass}}"></span>
	 *   {{label}}
	 * </button>
	 * ```
	 *
	 * @mixin module:delite/Templated
	 * @augments module:delite/Widget
	 */
	return dcl(Widget, /** @lends module:delite/Templated# */ {
		/**
		 * The widget template, either a string or the return value from `delite/handlebars!...`.
		 *
		 * Note that the template must be specified in the widget class (i.e. the prototype).
		 * It cannot be specified as a property to the widget constructor, nor can
		 * it be changed dynamically.
		 * @member {string|Function}
		 * @const
		 */
		template: "",

		buildRendering: function () {
			if (typeof this.template === "function") {
				this.template.call(this);
			} else {
				var renderFunc = cache[this.template] ||
					(cache[this.template] = handlebars.compile(this.template));
				renderFunc.call(this);
			}
		}
	});
});