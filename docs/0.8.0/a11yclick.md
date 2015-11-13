---
layout: doc
title: delite/a11yclick
---

# delite/a11yclick

When this module is loaded, pressing SPACE or ENTER while focused on an Element with a `d-keyboard-click`
attribute will fire a synthetic click event on that Element. Also works if the event target's ancestor
has that attribute set.

Usually this functionality is not necessary.  Rather, you should just make the focused Element a `<button>`,
and then the browser does the same thing natively.
This module is usually only needed when a custom element itself (ex: `<d-my-checkbox>`)
gets the focus rather than an Element inside of a custom element.

It returns a convenience function to set `d-keyboard-click` on an Element.




