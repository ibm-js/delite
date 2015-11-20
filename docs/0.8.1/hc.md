---
layout: doc
title: delite/hc
---

# delite/hc

Provides "High Contrast" feature detection for accessibility purposes.

This is useful for Internet Explorer and Firefox running on Windows.
It doesn't apply to Chrome or Safari (on mobile, mac, or desktop), which don't support high contrast mode.

## Introduction

By doing a `require()` of `delite/hc`,  `delite/hc` will set the `has("highcontrast")` flag
so code can check directly whether or not it is in high contrast mode and branch appropriately.
If the machine is in high contrast mode, `has("highcontrast")` is the text color being used by the browser
(that overrides the text color defined in CSS rules).


`delite/hc` will also add the `d-hc` CSS class to your document's `<body>` tag  if the machine is in high contrast mode.

Normally this module should not be used.  As long as widgets and applications avoid using background images for
icons, the browser will do everything for high contrast mode automatically.  The exception is for SVG,
which the browser does not adjust.


## Usage

Simply require the module, and then reference `has("highcontrast")`:


```js
require (["delite/hc", ...), function (has, ...) {
    ...
    var hcColor = has("highcontrast");
    if (hcColor) {
       mySvgNode.style.color = hcColor;
    }
});
```
  
