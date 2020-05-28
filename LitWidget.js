// Only needed on IE and legacy Edge, but it's so small I'm just including it for everyone.
// Difficult to load directly (like other polyfills) because the code is ES6.
import * as templatePolyfill from "lit-html/polyfills/template_polyfill.js";
templatePolyfill.initTemplatePolyfill();

import { html, render } from "lit-html";
import dcl from "dcl/dcl";
import Widget from "./Widget";
import { render as shadyRender } from "lit-html/lib/shady-render";

/**
 * Base class for widgts that render using lit-html.
 */
export default dcl([Widget], {
	/**
	 * Render using shadow dom.  Cannot be changed dynamically: should be set in a subclass prototype (or here).
	 */
	shadow: false,

	/**
	 * Return widget template filled in with all the widget's current property values.
	 * Will be passed to lit-html's render() method.
	 * @returns {TemplateResult}.
	 */
	render: function () {
		return html``;
	},

	initializeRendering: function () {
		if (this.shadow) {
			this.attachShadow({mode: "open"});
		}
	},

	refreshRendering: function () {
		if (!this.attached) {
			// Reduce rerenders on widget creation by waiting until we are attached to the document for first render.
			return;
		}

		if (this.shadow) {
			shadyRender(this.render(), this.shadowRoot, {scopeName: this.tagName.toLowerCase()});
		} else {
			render(this.render(), this);
		}
	},

	connectedCallback: function () {
		if (window.ShadyCSS !== undefined) {
			window.ShadyCSS.styleElement(this);
		}
	}
});
