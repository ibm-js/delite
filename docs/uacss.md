---
layout: doc
title: delite/uacss
---

# delite/uacss

**delite/uacss** adds browser "centric" CSS classes to a the document's `<body>` tag.  This is mainly used to be able
to easily apply browser specific CSS styles, working around browser limitations and quirks.

## Usage

In order to have the appropriate classes added to your document, just load the module:

```js
define(["delite/uacss"], function(){
    // do something...
});
```

Then provide CSS rules that leverage the classes:

```css
.d-ie-9 h1 {
	font-size: 24px;
}
```

There is no need to provide a variable in the callback function for `delite/uacss`, but the module will return an alias
to `requirejs-dplugins/has`.

There are several different features that are detected and classes that are added to the document:

Browser and version:

* `d-edge`
* `d-ie`
    * also, `d-ie-9`, `d-ie-10`, `d-ie-11` etc.
* `d-safari`
* `d-chrome`
* `d-ff`
    * `d-ff-31` etc.
* `d-ios`
* `d-android`

Browser category:

* `d-webkit` - chrome, safari, etc.


## See Also

* [`decor/sniff`](/decor/docs/0.5.0/sniff.html)


