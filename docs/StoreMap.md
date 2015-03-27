---
layout: doc
title: delite/StoreMap
---

# delite/StoreMap

`delite/StoreMap` is a mixin that can be mixed into a class inheriting from [`delite/Widget`](Widget.md) or `decor/Evented`
in order to query a store object from the [dstore](http://dstorejs.io/) project or an array, create render items for this widget
based on the store or the array items, and perform some automatic mapping between the properties on the source items and the
properties on the render items.

This is particularly useful for a widget that needs to create items (or render items) based on store entries
(like a data list, grid or calendar schedule etc.). Using this mixin, the widget will benefit from a standard
API and way of doing things. You will also benefit from the ability to map data from the source item to the properties
your widget is expecting on the render items.

This mixin is based on the `delite/Store` mixin which provides the source access and ability to create render items. Please
see [its documentation](Store.md) for details about those features.

Note : One must use items which contains an id property to be able to use all the function of `delite/StoreMap` correctly.
In particular when one uses array in the source property of the `delite/StoreMap`.

## Mapping properties and mapping functions

The mapping operation consists in mapping properties from the source item into potentially different properties on the
render item. You can define that mapping directly by attributes (from a property of the source item to another property
of the render item) or through a function (in which case the function can perform any type of mapping between the source
item and the render item).

For example, the source item (typically coming from a data server) might contain:

```js
{
    lastName: "Smith"
    firstName: "John",
    department: "marketing",
    title: "head of department",
    jobDescription: "in charge of defining the marketing strategy for the company"
}
```

while the widget render item requires and contains exactly what the widget needs to consume, in this case for example:

```js
{
    name: "John Smith"
    jobtitle: "head of department"
}
```

The mapping operation allows to easily go from the source item to the render item and conversely.

In order to configure the mapping of a `name` property to be present on each render item, the class using this
mixin must declare: 

* either a `nameAttr` property in which case the mapping is looking into the source item property specified by the value of `nameAttr`
* or a `nameFunc` property function in which case the mapping is delegated to the `nameFunc` function.

For example if `nameAttr` is set to `"firstName"`, when creating or updating the render items, the `delite/StoreMap` mixin will
use the value of the `firstName` property in the source item to set the value of the `name` property in the render item.
 
If `nameFunc` is set to:

```js
function nameFunc(item, source, value) {
  return item.firstName + " " + item.lastName;
}
```

the value of the `name` property on the render item will be a concatenation of the values of the `firstName` and `lastName`
properties on the source item.

Note that the function definition, when present, takes precedence over the attribute mapping definition.

The mapping can occur both ways, so if the `name` property value on the render item is modified, in the first case, the `firstName`
property will be modified accordingly in the source item. When using mapping by function, the function must take into
account the converse operation if needed as follows:

```js
function nameFunc(item, source, value) {
  if (arguments.length === 3) {
     // value is passed that is a setter
     // for example:
     var names = value.split(" ");
     item.firstName = names[0];
     item.lastName = names[1];
  } else {
    return item.firstName + " " + item.lastName;
  }
}
```

Here is an example of how the receiving class can declare the various mapping properties:

```js
define(["delite/register", "delite/Widget", "delite/StoreMap"/*, ...*/], 
  function (register, Widget, StoreMap/*, ...*/) {
  return register("employees-list", [HTMElement, Widget, StoreMap], {
    nameAttr: "firstName", // by default the label mapping will occur from firstName to name
    jobtitleAttr: null, // by default no jobtitle mapping by attribute but let the user use one
    jobtitleFunc: null, // by default no jobtitle mapping by function but let the user use one
    refreshRendering: function (props) {
       if ("renderItems" in props) {
         // render item has changed, do something to reflect that in the rendering
         // you should find the name & possibly jobtitle property on the render item instances
         // and modify the DOM accordingly
       }
    }
  });
});
```

A user of this class can then leverage this either in markup to specify particular mapping:

```html
<employees-list nameAttr="lastName" jobtitleAttr="title"></employees-list>
```

In this case the default mapping from "firstName" to "name" has been overridden to use the "lastName" attribute instead, and
the mapping for jobtitle is using the "title" attribute.

or in JavaScript:

```js
require(["EmployeesList"/*, ...*/], function (EmployeesList/*, ...*/) {
  var widget = new MyWidget();
  widget.nameAttr = "lastName";
  widget.jobtitleFunc = function (item, source, value) {
     if (arguments.length === 3) {
        // value is passed that is a setter
        var array = value.split(" ");
        item.title = array[0];
        item.jobDescription = array[1];
     } else {
       return item.title + " " + items.jobDescription;
     }
  }
  widget.placeAt(document.body);
});
``` 

If the `copyAllItemProps` property is set to `true` on the class, then in addition to properties mapped by attribute or
by function all the properties found on the source item are directly copied to the render item. This is useful to not
bother configuring the mapping, however this must be used with care as this might lead to copying un-needed properties.

Finally by default the mapping occurs only when a source item is created or updated, however under some conditions the
receiving class might need to re-perform that mapping operation dynamically. This might happen for example if some
properties of the widget have changed that should impact the mapping operation. In order to enable this possibility, 
the `allowRemap` property must be set to `true` and the `remap()` function must be called once a remapping operation is 
required.

## Mapping specified on instance

As the documentation states, mapping properties are meant to be defined in the widget class. However, one can
also add the mapping properties directly to an instance without defining them on the class, but in this case
there are two limitations:

* the property must be added before the widget is attached to the DOM
* if the property is added in the markup then only fully lower case properties are supported (e.g. foobar not fooBar)

## Mapping functions in markup

If a mapping function is specified via markup, it can reference `item`, `source` and `value` as implied parameters,
for example:

```html
<my-widget nameFunc="return item.firstname + ' ' + item.firstname;">
```

For simplicity, this example is not mapping rendering item changes back to the data source.

## Defining source via markup

The source can be defined via markup with an observable array.

```html
<my-widget ...>
	<!-- Add the following items to the store -->
    	{ "label": "France", "sales": 500, "profit": 50, "region": "EU" },
    	{ "label": "Germany", "sales": 450, "profit": 48, "region": "EU" },
    	{ "label": "UK", "sales": 700, "profit": 60, "region": "EU" },
    	{ "label": "USA", "sales": 2000, "profit": 250, "region": "America" },
    	{ "label": "Canada", "sales": 600, "profit": 30, "region": "America" },
    	{ "label": "Brazil", "sales": 450, "profit": 30, "region": "America" },
    	{ "label": "China", "sales": 500, "profit": 40, "region": "Asia" },
    	{ "label": "Japan", "sales": 900, "profit": 100, "region": "Asia" }
</my-widget>
```