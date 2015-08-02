---
layout: doc
title: delite/Container
---

# delite/Container

Base class for widgets that contain content.
Useful both for widgets that contain free-form markup (ex: ContentPane),
and widgets that contain an ordered list of children (ex: Toolbar).

Note that Container is not meant to be used for widgets that just internally create child
widgets (ex: a StarRating widget creates stars), but rather for when the widget has children from
the application's perspective (i.e. from the perspective of the widget *user* rather
than the widget *author*).

`Container` can be used as a superclass for any widget with `this.containerNode` defined, but it's especially useful
for widgets like a toolbar that contain (only) a set of child widgets.
In that case, you can use the `addChild()` and `removeChild()` API to adjust the list of widget children.
Also, you can override the `onAddChild()` method to find out whenever a child was added, either by
the custom `addChild()` method, or by `appendChild()` or `insertBefore()`.

Example:

```js
require([
	"delite/register", "delite/Container", "acme/MyButtonWidget", "requirejs-domready/domReady!"
], function(register, Container, MyButtonWidget){
	var MyToolbar = register("my-toolbar", [Container], { });

	var toolbar = new MyToolbar();
	toolbar.placeAt(document.body);
	toolbar.addChild(new MyButtonWidget({label: "click me"}));
	toolbar.addChild(new MyButtonWidget({label: "click me too"}));
});
```

