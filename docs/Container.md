---
layout: default
title: delite/Container
---

# delite/Container

Use this base class for widgets that contain (or sometimes contain) a list of child widgets,
in order to be able to adjust the list of child widgets via `addChild()` and `removeChild()`.

`Container` can be used as a superclass for any widget with `this.containerNode` defined, but it's especially useful
for widgets like a toolbar that contain (only) a set of child widgets.

You can use the `addChild()` and `removeChild()` API to adjust the list of widget children.

Example:

```js
require([
	"delite/register", "delite/Container", "acme/MyButtonWidget, "requirejs-domReady/domReady!"
], function(register, Container, MyButtonWidget){
	var MyToolbar = register("my-toolbar", [Container], { });

	var toolbar = new MyToolbar();
	toolbar.placeAt(document.body);
	toolbar.addChild(new MyButtonWidget({label: "click me"}));
	toolbar.addChild(new MyButtonWidget({label: "click me too"}));
});
```

