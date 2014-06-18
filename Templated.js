/** @module delite/Templated */
define([
	"dcl/dcl",
	"./Widget",
	"./handlebars"
], function (dcl, Widget, handlebars) {

	// TODO: combine this module with handlebars.js?

	// Text plugin to load the templates and do the build.
	var textPlugin = "requirejs-text/text";

	// Cache of compiled templates
	var cache = {};

	/**
	 * Plugin that loads a Handlebars template from a specified MID, and returns a base class
	 * for a reactive widget based on that template.
	 *
	 * Typically used like:
	 *
	 * ```js
	 * define([..., "delite/Templated!./templates/MyTemplate.html"], function(..., MyTemplated){
	 *     register("my-widget", [HTMLElement, MyTemplated], { ... });
	 * });
	 * ```
	 *
	 * It can also be used as a plain base class, if you specify `template` as a property:
	 *
	 *
	 * ```js
	 * define([..., "delite/Templated], function(..., Templated){
	 *     register("my-widget", [HTMLElement, Templated], { template: "..." });
	 * });
	 * ```
	 *
	 * However, the first form is preferred.
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
	var Templated = dcl(Widget, /** @lends module:delite/Templated# */ {
		/**
		 * The widget template.
		 * Generally this is set automatically when you use Templated as plugin.
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


	// Make Templated work as a plugin, ex: delite/Templated!./myWidget.html
	Templated.load = function (mid, require, onload) {
		require([textPlugin + "!" + mid], function (template) {
			onload(dcl(Templated, {template: template}));
		});
	};

	// Make build preload (i.e. include) the template's text.  Ideally builds would pre-compile the templates too,
	// by leveraging https://github.com/tmpvar/jsdom to provide methods like `document.createElement()`.
	Templated.pluginBuilder = textPlugin;

	return Templated;
});