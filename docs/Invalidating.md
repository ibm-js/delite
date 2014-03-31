---
layout: default
title: delite/Invalidating
---

# delite/Invalidating

`delite/Invalidating` is a mixin that can be mixed into a class inheriting from [`delite/Widget`](Widget.md) or `dojo/Evented` class 
in order to add the ability to watch a set of invalidating properties and delay to the next execution frame the refresh 
following the changes of the values of these properties. 

For that purpose the mixin adds two lifecycle phases to the class.

The first phase is the refresh properties phase. It is used to reconciliate instances properties after they have been
set. A typical example is making sure the value of a range component is correctly set between min and max values and 
that the max value is bigger than min value. This phase is optional and not all classes leveraging `delite/Invalidating`
will need it.

The second phase is the refresh rendering phase. It is used to refresh the rendering of the class (usually a 
`delite/Widget`) based on the new values of the changed properties. The advantage compared to doing that in a custom setter
or through template binding is that for several properties changes the refresh rendering phase will be called only once
leading to better performance by making sure the rendering is not modified several times in a row

Depending on the complexity of your widget you might or might not need to rely on `delite/Invalidating`.

Before proceeding, checkout [setup page](setup.md) on how to setup a project using delite. This will be required to leverage the samples from this page.

##### Table of Contents
[Setting Up Invalidating](#setting)  
[Implementing Lifecycle](#implementing)  
[Using Invalidating](#using)  
[Events](#events)

<a name="setting"></a>
## Setting up Invalidating

You can mixin `delite/Invalidating` into your widget or class, as follows:

```js
require(["delite/register", "delite/Widget", "delite/Invalidating"/*, ...*/], 
  function (register, Widget, Invalidating/*, ...*/) {
  return register("my-widget", [HTMElement, Widget, Invalidating], {
    a: true,
    b: "value"
  });
});
```

Once done you can specify which properties will be subject to invalidation. As described above there are two invalidation
phases. By default properties are only registered to target the refresh rendering phase. That can be done simply by listing
the properties to consider in a call to the `addInvalidatingProperties()` function. For a `delite/Widget` this is typically
done during the `preCreate()` function of its lifecycle as follows:

```js
require(["delite/register", "delite/Widget", "delite/Invalidating"/*, ...*/], 
  function (register, Widget, Invalidating/*, ...*/) {
  return register("my-widget", [HTMElement, Widget, Invalidating], {
    a: true,
    b: "value",
    c: null,
    preCreate: function () {
       this.addInvalidatingProperties("a", "b");
    }
  });
});
```

That way the `refreshRendering()` function of your widget will be called when the "a" and "b" properties values will be
changed. A change to "c" will not trigger a refresh rendering phase. Note that in order to be subject to invalidation 
the corresponding property must also haven been declared on the class, using the `addInvalidatingProperties()` method is 
required but not sufficient.

If you also want a property to trigger the refresh properties phase you can pass to `addInvalidatingProperties()` a hash
object that describes which properties are subject to refresh properties vs refresh rendering phase so that the 
`refreshProperties()` method will be called when it is modified:

```js
define(["delite/register", "delite/Widget", "delite/Invalidating"/*, ...*/], 
  function (register, Widget, Invalidating/*, ...*/) {
  return register("my-widget", [HTMElement, Widget, Invalidating], {
    a: true,
    b: "value",
    c: null,
    preCreate: function () {
       this.addInvalidatingProperties({
         "a" : "invalidateProperty",
         "b": "invalidateRendering"
       });
    }
  });
});
```

Note that any property subject to refresh properties phase will also be subject to the refresh rendering phase in a 
second phase.

<a name="implementing"></a>
## Implementing the Lifecycle

Once you have setup your class, you will need to implement the lifecycle functions in order to react to property changes.
This can be done by redefining the `refreshProperties()` and/or `refreshRendering()` functions. They both take as 
parameter a hash object which contains the name of the properties that have triggered the refresh action. This is 
particularly useful when several properties are involved.

```js
define(["delite/register", "delite/Widget", "delite/Invalidating"/*, ...*/], 
  function (register, Widget, Invalidating/*, ...*/) {
  return register("my-widget", [HTMElement, Widget, Invalidating], {
    a: true,
    b: "value",
    preCreate: function () {
       this.addInvalidatingProperties({
         "a" : "invalidateProperty",
         "b": "invalidateRendering"
       });
    },
    refreshProperties (props) {
      if (props.a) {
        // do something logical that does not directly impact the DOM because "a" has changed
      }
    },
    refreshRendering (props) {
      if (props.b) {
        // modify the DOM because "b" has changed
      }
      if (props.a) {
      }
    }
  });
});
```

In `refreshProperties()` you have the opportunity to modify the properties hash object in order to notify the refresh
rendering phase that some properties are of no interest to it. For example you might want to do:

```js
refreshProperties (props) {
  if (props.a) {
     // do something logical that does not directly impact the DOM because "a" has changed
     delete props.a;
  }
}
```

In which case the "a" property won't be part of the hash object passed to the `refreshRendering()` function.

<a name="using"></a>
## Using Invalidating

Once setup you don't need anything special to use the invalidating class. You just need to change one of the invalidating
properties and the refresh methods will be called automatically for you.

If for some reason you want to invalidate a particular property without setting it explicitly then you can call:
  * `invalidateProperty()` to invalidate for refresh properties phase
  * `invalidateRendering()` to invalidate for refresh rendering phase
You will need to pass the name of the property to invalidate to the invalidation function.

In some cases you might want to force the rendering to occur right after a given property has been set. For that you can
use one of the following function:
  * `validateRendering()` to only trigger the refresh rendering phase
  * `validateProperties()` to trigger the refresh properties phase which will itself trigger the refresh rendering phase
  * `validate()` to directly trigger both the refresh properties & rendering phases.

<a name="events"></a>
## Events

The `delite/Invalidating` mixin provides the following events:

|event name|dispatched|cancelable|bubbles|properties|
|----------|----------|----------|-------|----------|
|refresh-properties-complete|after refresh properties|No|True|<ul><li>`invalidatedProperties`: the hash object of invalidated properties passed to the `refreshProperties()` function</li></ul>|
|refresh-rendering-complete|after refresh rendering|No|True|<ul><li>`invalidatedProperties`: the hash object of invalidated properties passed to the `refreshRendering()` function</li></ul>
