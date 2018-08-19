/** @module delite/register */
define([
	"dcl/advise",
	"dcl/dcl",
	"./customElements!"
], function (
	advise,
	dcl
) {
	"use strict";

	// Hack DCL so that MyWidget#constructor() doesn't do HTML*Element.apply(this, arguments)...
	// since that throws an exception.
	// An alternate approach might be to have the HTMLElement wrapper shim with
	// browserConstruction and userConstruction flags, like native-shim.js used to have,
	// see https://github.com/Mindcraft1/custom-element-ie11/blob/master/shim/native-shim.js.
	function weaveConstructorChain(chain, utils) {
		var newProp = utils.cloneDescriptor(chain[chain.length - 1]);
		chain = chain.map(function (prop) {
			return prop.get || prop.set ? utils.adaptGet(prop.get) : prop.value;
		});
		newProp.value = function () {
			for (var i = 0; i < chain.length; ++i) {
				/* global HTMLUnknownElement */
				if (chain[i] !== HTMLElement && chain[i] !== HTMLUnknownElement) {
					chain[i].apply(this, arguments);
				}
			}
		};
		return newProp;
	}
	var weaveConstructorAfter  = {name: "after", weave: weaveConstructorChain};
	dcl.chainAfter = function (ctr, name) {
		return dcl.chainWith(ctr, name, name === "constructor" ? weaveConstructorAfter : dcl.weaveAfter);
	};
	dcl._origMakeStub = dcl._makeStub;
	dcl._makeStub = function (aroundStub, beforeChain, afterChain) {
		if (aroundStub === HTMLElement || aroundStub === HTMLUnknownElement) {
			aroundStub = null;
		}
		return dcl._origMakeStub(aroundStub, beforeChain, afterChain);
	};

	/**
	 * Define a custom element from a set of properties and a list of superclasses.
	 *
	 * @param  {string}               tag             The custom element's tag name.
	 * @param  {Object[]}             superclasses    Any number of superclasses to be built into the custom element
	 *                                                constructor. But first one must be [descendant] of HTMLElement.
	 * @param  {Object}               props           Properties of this baseCtor class.
	 * @return {Function}                             A constructor function that will create an instance of the custom
	 *                                                element.
	 * @function module:delite/register
	 */
	function register(tag, superclasses, props) {
		// Create the baseCtor class by extending specified superclasses and adding specified properties.

		// Make sure all the bases have their proper constructors for being composited.
		// I.E. remove the wrapper added by getTagConstructor().
		var superclassesArray = Array.isArray(superclasses) ? superclasses : superclasses ? [superclasses] : [];
		var bases = superclassesArray.map(function (extension) {
			return (extension && extension._ctor) || extension;
		});

		// Get root (aka native) class: HTMLElement, HTMLInputElement, etc.
		var BaseHTMLElement = bases[0];
		if (BaseHTMLElement.prototype && BaseHTMLElement.prototype._BaseHTMLElement) {
			// The first superclass is a custom element created by another call to register(),
			// so get that custom element's root HTML*Element.
			BaseHTMLElement = BaseHTMLElement.prototype._BaseHTMLElement;
		}

		// Get name of tag that this BaseCtor extends, for example <button is="..."> --> "button"
		if (BaseHTMLElement !== HTMLElement) {
			throw new TypeError(tag + ": must have HTMLElement in prototype chain");
		}

		// Get a composited constructor
		var CustomElementClass = dcl(bases, props || {}),
			proto = CustomElementClass.prototype;
		proto._ctor = CustomElementClass;
		proto._BaseHTMLElement = BaseHTMLElement;
		proto._tag = tag;

		// Use trick from https://github.com/w3c/webcomponents/issues/587#issuecomment-254017839
		// to create constructor.
		var Constructor = function () {
			/* global Reflect */
			var elem;
			if (typeof Reflect === "object") {
				// I want the third argument CustomElementClass but that throws exceptions in some cases.
				elem = Reflect.construct(BaseHTMLElement, [], Constructor);
			} else {
				// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct
				elem = BaseHTMLElement.call(this);
				Object.setPrototypeOf(elem, Constructor.prototype);
			}

			CustomElementClass.prototype.constructor.apply(elem, arguments);

			return elem;
		};
		Object.setPrototypeOf(Constructor.prototype, CustomElementClass.prototype);
		//Object.setPrototypeOf(Constructor, CustomElementClass.prototype);
		var ConstructorProto = CustomElementClass.prototype;

		// TODO: remove this code, clients shouldn't manually call connectedCallback/disconnectedCallback at all.
		// Monkey-patch connectedCallback() and detachedCallback() to avoid double executions.
		// Generally this isn't an issue, but it could happen if the app manually called the functions
		// and then they were called automatically too.
		advise.around(ConstructorProto, "connectedCallback", function (sup) {
			return function () {
				if (this._attached) { return; }
				if (sup) { sup.apply(this, arguments); }
				this._attached = true;
			};
		});
		advise.around(ConstructorProto, "disconnectedCallback", function (sup) {
			return function () {
				if (!this._attached) { return; }
				if (sup) { sup.apply(this, arguments); }
				this._attached = false;
			};
		});

		// Define the custom element.
		/* global customElements */
		customElements.define(tag, Constructor);

		// Add some flags for debugging and return the new constructor
		Constructor.tag = tag;
		Constructor._ctor = CustomElementClass;

		return Constructor;
	}

	/**
	 * Converts plain Element of custom type into "custom element", by adding the widget's custom methods, etc.
	 * Does nothing if the Element has already been converted or if it doesn't correspond to a registered custom tag.
	 * After the upgrade, calls `constructor()`.
	 *
	 * Usually the application will not need to call this method directly, because it's called automatically
	 * on page load and as elements are added to the document.
	 *
	 * @function module:delite/register.upgrade
	 * @param {Element} element - The DOM node.
	 */
	register.upgrade = function (elem) {
		if (customElements.upgrade) {
			customElements.upgrade(elem);
		}
	};

	/**
	 * Synchronously upgrade any custom tags in the document that have not yet been upgraded.
	 * Nodes are automatically updated synchronously when the browser has native custom element support,
	 * but only asynchronously when the polyfill is being used.  Should not be called before domReady event.
	 */
	register.deliver = function () {
		if (customElements.upgrade) {
			customElements.upgrade(document.body);
		}
	};

	return register;
});
