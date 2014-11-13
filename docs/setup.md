---
layout: default
title: setup
---

# Setup a project using delite

The various delite modules can be consumed from two forms:

* the delite built AMD layer
* the delite source AMD modules

In order to install the built form:

```sh
bower install delite-build
```

Similarly, for the source form:

```sh
bower install delite
```

Both commands will install delite and its dependencies in a `bower_components` directory.

Using the source form is as simple as requiring the needed AMD modules using RequireJS:

```js
require.config({
   baseUrl: "bower_components"
});
require(["delite/register", "requirejs-domready/domReady!"], function (register) {
   register("my-element", [HTMLElement, Widget], {    
        //...
   });
   register.parse();
   //...
});
```
   
In order to consume the [built form](https://github.com/ibm-js/delite-build#how-to-use) you first need to load the 
corresponding layer and then the AMD modules as follows:
 
 ```js
 require.config({
    baseUrl: "bower_components"
 });
 require(["delite/layer"], function() {
   require(["delite/register", "requirejs-domready/domReady!"], function (register) {
      //...
   });
 });
 ```
 
When using the source form (or the built form if needed), you can build your resulting application using
the [grunt-amd-build](https://github.com/ibm-js/grunt-amd-build) project.

Alternatively you can use the [delite Yeoman generator](https://www.npmjs.org/package/generator-delite-element) to
setup the project structure.
