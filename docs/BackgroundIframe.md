---
layout: doc
title: delite/BackgroundIframe
---

# delite/BackgroundIframe

`delite/BackgroundIframe` is a utility class used by popups (specifically, used by [`delite/popup`](popup.md).

It adds an iframe as a child of the specified node, so the popup doesn't get interference from
a flash, pdf, etc. control on the main page.

Usage from the main widget is like:

```js
render: function () {
	...
	this.own(new BackgroundIframe(this));
}
```

The iframe is actually disabled by default, but can be enabled by manually setting the `config-bgIframe` has()
flag:

```js
require.config({
	config: {
		"requirejs-dplugins/has": {
			"config-bgIframe": true
		}
	}
}
```

This can also be done as part of the build.