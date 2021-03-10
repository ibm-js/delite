// Only needed on IE and legacy Edge, but it's so small I'm just including it for everyone.
// Difficult to load directly (like other polyfills) because the code is ES6.
import * as templatePolyfill from "lit-html/polyfills/template_polyfill.js";
templatePolyfill.initTemplatePolyfill();

import { html, render } from "lit-html";
import dcl from "dcl/dcl";
import Widget from "./Widget";
import { render as shadyRender } from "lit-html/lib/shady-render";

/**
 * Base class for widgets that render using lit-html.
 */
export default dcl([Widget], {
	/**
	 * Render using shadow dom.  Cannot be changed dynamically: should be set in a subclass prototype (or here).
	 */
	shadow: false,

	/**
	 * If this is a Set with property names, the widget only (re)renders
	 * when one of the properties in this list changes.
	 */
	propsAffectingRender: null,

	/**
	 * If this is a Set with property names, the widget doesn't (re)render
	 * unless a property *not* listed here changes.
	 */
	propsNotAffectingRender: null,

	/**
	 * Return true if the property changes listed in `oldValues` require the widget to rerender.
	 * @param oldValues
	 * @returns {boolean}
	 */
	needsRender: function (oldValues) {
		// Reduce rerenders on widget creation by waiting until we are attached to the document for first render.
		// Then force render the first time we are attached.
		if (!this.attached) {
			return false;
		} else if ("attached" in oldValues) {
			return true;
		}

		if (this.propsAffectingRender) {
			return Object.keys(oldValues).some(function (prop) {
				return this.propsAffectingRender.has(prop);
			}.bind(this));
		} else if (this.propsNotAffectingRender) {
			return !Object.keys(oldValues).every(function (prop) {
				return this.propsNotAffectingRender.has(prop);
			}.bind(this));
		} else {
			return true;
		}
	},

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

	refreshRendering: function (oldValues) {
		if (this.needsRender(oldValues)) {
			if (this.shadow) {
				shadyRender(this.render(), this.shadowRoot, { scopeName: this.tagName.toLowerCase() });
			} else {
				render(this.render(), this);
			}
		}
	},

	connectedCallback: function () {
		if (window.ShadyCSS !== undefined) {
			window.ShadyCSS.styleElement(this);
		}
	}
});
