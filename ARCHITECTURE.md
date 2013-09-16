[Temporary?] place to hold DUI design decisions and architecture notes.

# CSS theme loader

TODO: document

# ES5 native accessors

The goal is to support ES5 native accessors (i.e. getters/setters) so that application code
can do things like:

	myWidget.label = "hello";

instead of:

	myWidget.set("label", "hello");

Ideally this would be supported via [dcl](http://www.dcljs.org/) but we are
[still waiting for that](https://github.com/uhop/dcl/issues/2).  It's not supported
by [ComposeJS](https://github.com/kriszyp/compose) either, although Kitson has
[a branch](https://github.com/kitsonk/core/blob/master/compose.js#L373) that supports it,
so using his branch is another option, if we could live with ComposeJS's limited features like
lack of C3MRO.

Anyway, for now, the custom setters are supported by dui/register, which
takes a syntax similar to the dijit V1 way of declaring widgets:

	register("dui-button", ... {
		label: "Press",
		_setLabelAttr: function(val){
				this._set("label", ...);
				...
			}
		}
	});

Dui/register will note all the properties defined in the prototype, direct and inherited,
and call Object.defineProperty() on the widget's prototype to add native ES5 setters.

In this way we support native accessors while building on top of the old dojo.declare() code.

Dui/register also takes the shorthand syntaxes from Dijit V1 like:

	_setTabIndexAttr: "focusNode"

in addition to a new syntax that means to setup a custom setter that merely calls this._set(),
thus causing a watch() notification:

	_setLabelAttr: null,

# Observation

Related to supporting accessors, we still need to be able to watch for changes to [a subset of]
the widget properties.  This is needed for reactive templates etc.   I.e. we want to support

	myWidget.watch("myProperty", callback);

and have it work even when widget properties are set via native acessors, i.e. via:

	myWidget.myProperty = 123;

Ideally we would use [Object.observe()](http://updates.html5rocks.com/2012/11/Respond-to-change-with-Object-observe)
or some similar functionality like
[Firefox's watch() method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/watch)
or [IE's onpropertychange listener](http://msdn.microsoft.com/en-us/library/ie/ms536956.aspx).
Unfortunately there is no support for any of these on current versions of Webkit.  Even when Webkit starts
to support Object.observe() (in its production release, without flipping an switch to
"turn on experimental features"), it will be a while before the change trickles down to the mobile devices
we want to support.

Polymer tries to polyfill this functionality with it's [observe-js](https://github.com/Polymer/observe-js)
library.  However, after changing an object property (or set of object properties) the app needs to call
`Platform.performMicroTaskCheckpoint()`, or a similar method like `observer.deliver()`, so this hardly seems
like an acceptable solution.

Therefore, DUI aims to monitor property changes by having custom setters for all watchable properties.

The widget prototype should define custom setters for any properties that can be watched.   There's a shorthand
though, as listed above:

	register("dui-button", ... {
		label: "Press",
		_setLabelAttr: null
	});

If you call watch() on a property without a custom setter, watch() will create one on the fly on the instance.
However, that will be slower than having it in the prototype.

# Reactive templates

TODO: merge from wkeese/handlebars branch

# Custom elements

TODO: implement and document

