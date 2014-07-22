---
layout: default
title: delite/css
---

# delite/css!

This plugin will load and wait for a css file. This can be handy to load the css
specific to a widget.

CSS loaded with this plugin can be overwritten by user-defined style sheet, using `<link>` or `<style>` tag.

This plugin will return the path of the inserted css file relative to requirejs baseUrl.

## Example

To load the css file `myproj/comp.css` you can use:
```
require(["delite/css!myproj/comp.css"], function (){
	// Code placed here will wait for myproj/comp.css before running.
});
```

Or as a widget dependency:

```
define(["delite/css!myproj/comp.css"], function (){
	// My widget factory
});
```

