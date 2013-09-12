define([
	"dojo/_base/declare"
], function (declare) {
	'use strict';

	var apn = {};
	function propNames(name){
		// summary:
		//		Helper function to map "foo" --> "_setFooAttr" with caching to avoid recomputing strings

		if(apn[name]){ return apn[name]; }
		var uc = name.replace(/^[a-z]|-[a-zA-Z]/g, function(c){ return c.charAt(c.length-1).toUpperCase(); });
		return (apn[name] = {
			s: "_set" + uc + "Attr",	// converts dashes to camel case, ex: accept-charset --> _setAcceptCharsetAttr
			g: "_get" + uc + "Attr"
		});
	}

	function genSetter(/*String*/ attr, /*Object*/ commands){
		// summary:
		//		Return setter for a widget property, often mapping the property to a
		//		DOMNode attribute, innerHTML, or innerText.
		//		Note some attributes like "type" cannot be processed this way as they are not mutable.
		// attr:
		//		Name of widget property, ex: "label"
		// commands:
		//		A single command or array of commands.  A command is:
		//
		//			- null to indicate a plain setter that just saves the value and notifies listeners registered with watch()
		//			- a string like "focusNode" to set this.focusNode[attr]
		//			- an object like {node: "labelNode", type: "attribute", attribute: "role" } to set this.labelNode.role
		//			- an object like {node: "domNode", type: "class" } to set this.domNode.className
		//			- an object like {node: "labelNode", type: "innerHTML" } to set this.labelNode.innerHTML
		//			- an object like {node: "labelNode", type: "innerText" } to set this.labelNode.innerText

		function genSimpleSetter(command){
			var mapNode = command.node || command || "domNode";	// this[mapNode] is the DOMNode to adjust
			switch(command ? command.type : "null"){
				case "null":
					// _setFooAttr: null means to not do anything except make the property watchable
					return function(value){
						this._set(attr, value);
					};					
				case "innerText":
					return function(value){
						this.runAfterRender(function(){
							this[mapNode].innerHTML = "";
							this[mapNode].appendChild(this.ownerDocument.createTextNode(value));
						});
						this._set(attr, value);
					};
				case "innerHTML":
					return function(value){
						this.runAfterRender(function(){
							this[mapNode].innerHTML = value;
						});
						this._set(attr, value);
					};
				case "class":
					return function(value){
						this.runAfterRender(function(){
							domClass.replace(this[mapNode], value, this[attr]);
						});
						this._set(attr, value);
					};
				default:
					// Map to DOMNode attribute, or attribute on a supporting widget.
					// First, get the name of the DOM node attribute; usually it's the same
					// as the name of the attribute in the widget (attr), but can be overridden.
					// Also maps handler names to lowercase, like onSubmit --> onsubmit
					var attrName = command.attribute ? command.attribute :
						(/^on[A-Z][a-zA-Z]*$/.test(attr) ? attr.toLowerCase() : attr);

					return function(value){
						if(typeof value == "function"){ // functions execute in the context of the widget
							value = lang.hitch(this, value);
						}
						this.runAfterRender(function(){
							if(this[mapNode].tagName){
								// Normal case, mapping to a DOMNode.  Note that modern browsers will have a mapNode.setAttribute()
								// method, but for consistency we still call domAttr().  For 2.0 change to set property?
								domAttr.set(this[mapNode], attrName, value);
							}else{
								// mapping to a sub-widget
								this[mapNode].set(attrName, value);
							}
						});
						this._set(attr, value);
					};
			}
		}

		if(commands instanceof Array){
			// Unusual case where there's a list of commands, ex: _setFooAttr: ["focusNode", "domNode"].
			var setters = array.map(commands, genSimpleSetter);
			return function(value){
				setters.forEach(function(setter){
					setter.call(this, value);
				}, this);
			}
		}else{
			return genSimpleSetter(commands);
		}
	}

	return function (tag, superclasses, props) {
		// summary:
		//		Declare a widget class.
		//		Eventually this will be for creating a custom element, hence the tag parameter.
		//
		//		props{} can provide custom setters/getters for widget properties, which are called automatically when
		//		the widget properties are set.
		//		For a property XXX, define methods _setXXXAttr() and/or _getXXXAttr().
		//
		//		_setXXXAttr can also be a string/hash/array mapping from a widget attribute XXX to the widget's DOMNodes:
		//
		//		- DOM node attribute
		// |		_setFocusAttr: {node: "focusNode", type: "attribute"}
		// |		_setFocusAttr: "focusNode"	(shorthand)
		// |		_setFocusAttr: ""		(shorthand, maps to this.domNode)
		//		Maps this.focus to this.focusNode.focus, or (last example) this.domNode.focus
		//
		//		- DOM node innerHTML
		//	|		_setTitleAttr: { node: "titleNode", type: "innerHTML" }
		//		Maps this.title to this.titleNode.innerHTML
		//
		//		- DOM node innerText
		//	|		_setTitleAttr: { node: "titleNode", type: "innerText" }
		//		Maps this.title to this.titleNode.innerText
		//
		//		- DOM node CSS class
		// |		_setMyClassAttr: { node: "domNode", type: "class" }
		//		Maps this.myClass to this.domNode.className
		//
		//		If the value of _setXXXAttr is an array, then each element in the array matches one of the
		//		formats of the above list.
		//
		//		If the custom setter is null, no action is performed other than saving the new value
		//		in the widget (in this), and notifying any listeners registered with watch()

		// Create the widget class by extending specified superclasses and adding specified properties.
		// Then create a a wrapper class around that, with native accessors and introspected metadata.

		// If classes in superclass array are wrapped (see end of this method), then unwrap them
		superclasses = superclasses instanceof Array ? superclasses :
			typeof superclasses == "function" ? [superclasses] : [];
		superclasses = superclasses.map(function(superclass){
			return superclass._ctor || superclass;
		});

		// Convert shorthand notations like alt: "focusNode" into real functions
		props = props || {};
		Object.keys(props).forEach(function(name){
			var names = propNames(name);
			if(props[names.s] && typeof props[names.s] != "function"){
				// overwrites the original property but probably no one will mind
				props[names.s] = genSetter(name, props[names.s]);
			}
		});

		// Generate class
		var ctor = declare(superclasses, props),
			proto = ctor.prototype;

		// Generate a wrapper class around the real class.  We'll setup native accessors on the wrapper class,
		// and also generate _onMap, mapping names like "mousedown" to functions like onMouseDown.
		// Don't setup the native constructors on the real class because that would interfere with when we later
		// extended the real class.
		var wrapperCtor = declare(ctor, {
			_ctor: ctor,	// for debugging
			tag: tag,	// for debugging
			_props: {}
		});
		var onMap = (wrapperCtor._onMap = {}), props = wrapperCtor.prototype._props;
		Object.keys(proto).forEach(function(name){
			if(/^on/.test(name)){
				onMap[name.substring(2).toLowerCase()] = name;
			}
			var names = propNames(name);
			if(proto[names.s]){
				props[name] = proto[name];	// save raw property value
				Object.defineProperty(wrapperCtor.prototype, name, {
					set: function(val){
						this[names.s](val);
					},
					get: proto[names.g] ? function(){
						return this[names.g]();
					} : function(){
						return this._props[name];
					}
				});
			}
		});

		return wrapperCtor;
	}
});