/** @module delite/Templated */
define([
	"dcl/dcl",
	"./Widget",
	"./handlebars"
], function (dcl, Widget, handlebars) {

	// Cache of compiled templates
	var cache = {};

	/**
	 * Base class for templated widgets.
	 * @mixin module:delite/Templated
	 * @augments module:delite/Widget
	 */
	return dcl(Widget, /** @lends module:delite/Templated# */ {
		/**
		 * The widget template.
		 * Can be inlined, or loaded from a file like:
		 *
		 * ```js
		 * define([
		 *     "delite/Templated",
		 *     "requirejs-text/text!myTemplate.html"
		 * ], function (Templated, template) {
		 *    return register("my-widget", [Templated], {
		 *        template: template
		 *    });
		 * );
		 * ```
		 *
		 * Note that the template must be specified in the widget class (i.e. the prototype).
		 * It cannot be specified as a property to the widget constructor, nor can
		 * it be changed dynamically.
		 * @member {string}
		 * @const
		 */
		template: "",

		buildRendering: function () {
			var renderFunc = cache[this.template] ||
				(cache[this.template] = handlebars.compile(this.template));
			renderFunc.call(this);
		}
	});
});