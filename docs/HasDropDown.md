---
layout: default
title: delite/HasDropDown
---

# delite/HasDropDown

delite/HasDropDown is a base class that provides drop-down menu functionality.
Widgets like Select, ComboBox, DropDownButton, DateTextBox etc. could use `delite/HasDropDown`
to implement their functionality.

However, note that it's geared towards desktop browsers.
It doesn't adjust for phones, which should use an overlay rather than a dropdown,
nor does it adjust for iOS tablets, which always enclose the dropdown in a tooltip.

This will be addressed somehow in the future.

## Usage

First, make your widget extend `delite/HasDropDown`:

```js
register("my-widget", [HTMLElement, HasDropDown], {
  ...
});
```

Then, either set the value of `HasDropDown#dropDown` to an existing widget:

```js
register("my-widget", [HTMLElement, HasDropDown], {
  dropDown: new MyMenu()
});
```

Or, override the `HasDropDown#loadDropDown()` and `HasDropDown#isLoaded()` methods to allow for lazy instantiation
of the drop-down (see "Dynamic & lazy-loading drop-downs", below).

## Optional node properties

Note: All of these properties can only be set *before* `Widget#render()` is called.

### buttonNode


By default, `delite/HasDropDown` will use either `focusNode` or `domNode` as the element to click to display the drop-down.
If you want to use a specific element to click to display the drop-down instead, attach that element to `buttonNode`.

### arrowWrapperNode

When `delite/HasDropDown` is instantiated, a CSS class
`d-up-arrow-button`, `d-down-arrow-button`, `d-right-arrow-button` etc. is added to specify
which direction the pop-up appears by default relative to the widget.
By default, these classes are set on `buttonNode`.
Attaching an element to `arrowWrapperNode` will cause these classes to be applied to that element instead.

### popupStateNode

When a drop-down is opened, a CSS class `d-drop-down-open` attribute is added to indicate that the drop-down is open.
By default, these changes apply to `focusNode`, or `buttonNode` if there is no `focusNode`.
Attaching an element to `popupStateNode` will cause these changes to occur on that element instead.

### aroundNode

When the drop-down is opened, it is positioned based on the location of `domNode`.
Attaching an element to `aroundNode` will cause the drop-down to be positioned relative to that element instead.

## Dynamic & lazy-loading drop-downs

By default, HasDropDown assumes that a delite widget has been created and assigned to `HasDropDown.dropDown`
before the widget starts up.
This works well for drop-downs that always contain the same content and are available immediately,
but it may reduce startup performance and it makes it impossible to create dynamically populated/asynchronous drop-downs.
In order to work around these limitations, more advanced drop-down widgets can implement
`HasDropDown#loadDropDown()` and `HasDropDown#isLoaded()` instead:

```js
register("my-widget", [HTMLElement, HasDropDown], {
	  isLoaded: function () {
		  // Returns whether or not we are loaded - if our dropdown has an href,
		  // then we want to check that.
		  var dropDown = this.dropDown;
		  return !!dropDown && (!dropDown.href || dropDown.isLoaded);
	  },

	  loadDropDown: function(callback){
		  // Loads our dropdown
		  var dropDown = this.dropDown;
		  if (!dropDown) { return; }
		  if (!this.isLoaded()) {
			  var handler = dropDown.on("load", this, function () {
				  handler.remove();
				  callback();
			  });
			  dropDown.refresh();
		  }else{
			  callback();
		  }
	  }
  });
});
```

## Forwarding keystrokes to the dropdown

Sometimes it's useful to leave focus on the anchor widget (i.e. the widget extending HasDropDown, rather
than the dropdown itself), but to delegate some keystrokes to the dropdown widget.
A typical example is a TimeTextBox widget, where the focus remains on the `<input>` so that the left/right
arrow keys can navigate between the characters, but the up/down arrow keys will switch between choices
in the drop down.

HasDropDown supports this usage pattern.  The dropdown should have a `handleKey(evt)` method, which
HasDropDown will call with the `keydown` event.  The `handleKey()` method should return
false (not undefined, but false) if the dropdown handled the key event, or don't return anything to let the HasDropDown
widget itself handle the keystroke.

For example, the `hasDropDown()` method of a TimePicker dropdown widget might look like:

```js
handleKey: function(/*Event*/ evt){
	if (evt.keyCode == keys.DOWN_ARROW) {
		this.selectNextNode();
		evt.stopPropagation();
		evt.preventDefault();
		return false;
	}else if (evt.keyCode == keys.UP_ARROW) {
		this.selectPreviousNode();
		evt.stopPropagation();
		evt.preventDefault();
		return false;
	}else if (evt.keyCode == keys.ENTER) {
		if (this._keyboardSelectedChoice) {
			this.selectChoice(this._keyboardSelectedChoice);
		}
		evt.stopPropagation();
		evt.preventDefault();
		return false;
	}
}
```
