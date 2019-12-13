---
layout: doc
title: setup
---

# Setup a project using delite

In order to install delite:

```sh
npm install delite
```


This will install delite and its dependencies in a `node_modules` directory.

Using is as simple as requiring the needed AMD modules using RequireJS:

```js
require.config({
   baseUrl: "node_modules"
});
require(["delite/register"], function (register) {
   register("my-element", [HTMLElement, Widget], {    
        //...
   });
});
```
