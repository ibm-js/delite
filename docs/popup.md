---
layout: doc
title: delite/popup
---

# delite/popup

delite/popup is the main mechanism within delite that enables the creation of pop-ups like dropdowns and tooltips.
It is used by every widget that creates a pop-up around another element.

Note that often custom widgets will want to extend [`delite/HasDropDown`](HasDropDown.md)
rather than using `delite/popup` directly.

When displaying a pop-up, there are usually two widgets involved:

* The parent widget, which controls opening and closing of the pop-up (by using `delite/popup`)
* The pop-up/dropdown widget itself

## API

Here’s an example that illustrates how a widget might open and close a drop down using `delite/popup`.
It's the basic pattern followed by [`delite/HasDropDown`](HasDropDown.md).

The example involves two widgets:

* this - The parent widget, which controls opening and closing of the pop-up
* dropDown - The pop-up (aka dropdown) widget itself


```js
define(["delite/popup"], function(popup){
	...

	// wrap the pop-up widget and position it offscreen so
	// that it can be measured by the widget’s initialization code
	popup.moveOffScreen(dropDown);

	// make the pop-up appear around my node
	popup.open({
		parent: this,
		popup: dropDown,
		around: this,
		orient: ["below-centered", "above-centered"],
		onExecute: function(){
			popup.close(dropDown);
		},
		onCancel: function(){
			popup.close(dropDown);
		},
		onClose: function(){
		}
	});

	...
}
```

As you can see, there are three essential calls here, `popup.moveOffScreen`, `popup.open`, and `popup.close`.
`popup.moveOffScreen` wraps the popup widget in a container, appends it to the `<body>`,
then moves it off-screen so that size measurements are possible.
Once that’s done, it opens the pop-up by calling `popup.open`.
Finally, the `onExecute` and `onCancel` callbacks both call `popup.close`, passing in the correct pop-up widget to close.

It’s important to note here that the parent widget is responsible for both opening *and closing* the pop-up.
This architecture was used so that the parent widget is always aware of whether or not its child pop-up is open,
and so that it can easily perform any necessary clean-up or other relevant activity once its pop-up has closed.

## open()

Opening a pop-up from a parent widget involves calling `popup.open` with a kwArgs object
that provides information about the pop-up and its related parent widget.
The available properties for this object are:

* parent (Widget)
  The widget that is displaying the pop-up.
* popup (Widget, required)
  The widget to display as a pop-up. This can be any widget.
* around (DomNode)
  A DOM node that should be used as a reference point for placing the pop-up.
  For pop-ups that are not meant to be placed around an element, use `x` and `y` instead
* x (number)
  The absolute horizontal position in pixels at which to place the pop-up.
* y (number)
  The absolute vertical position in pixels at which to place the pop-up.
* orient (string[])
  When placing a pop-up around a DOM node, it is possible to specify where the pop-up should appear around it
  by providing an array of position strings.  Delite will try each position in order until the pop-up appears
  fully within the viewport.  Possible values are:

    * before: places drop down to the left of the anchor node/widget, or to the right in the case
      of RTL scripts like Hebrew and Arabic; aligns either the top of the drop down
      with the top of the anchor, or the bottom of the drop down with bottom of the anchor.
    * after: places drop down to the right of the anchor node/widget, or to the left in the case
      of RTL scripts like Hebrew and Arabic; aligns either the top of the drop down
      with the top of the anchor, or the bottom of the drop down with bottom of the anchor.
    * before-centered: centers drop down to the left of the anchor node/widget, or to the right
      in the case of RTL scripts like Hebrew and Arabic
    * after-centered: centers drop down to the right of the anchor node/widget, or to the left
      in the case of RTL scripts like Hebrew and Arabic
    * above-centered: drop down is centered above anchor node
    * above: drop down goes above anchor node, left sides aligned
    * above-alt: drop down goes above anchor node, right sides aligned
    * below-centered: drop down is centered above anchor node
    * below: drop down goes below anchor node
    * below-alt: drop down goes below anchor node, right sides aligned

  If left undefined, the default value is `[ "below", "below-alt", "above", "above-alt" ]`.

* onCancel (function())
  A callback that is executed when the user has tried to cancel the pop-up by either hitting ESC
  or by using the pop-up’s cancel mechanism.
* onClose (function())
  A callback that is executed when the pop-up is actually closed by `popup.close`.
* onExecute (function())
  A callback that is executed when a user has “executed” a function in the pop-up, like selecting a menu option.
* padding (`{x: Number, y: Number}`)
  An object that specifies extra padding that should be given to the area around the pop-up when determining its placement.

While only the `popup` property is required, most pop-ups will normally need to also provide `onCancel` and `onExecute`
callbacks (as explained below) as well as either an `around` or `x` and `y` properties.


## Notes on Widgets Used as Popups

Any normal widget can be used as a pop-up.
For example, a Calendar is a normal widget that can be displayed inline in the page,
but could be used as a pop-up by a DateTextBox widget.
In other words, there’s no `PopupWidget` base class (and no need for one).

### Popup Widget Emitted Events

However, there are three important events that the pop-up widget can emit to hint
to the parent widget that it's ready to be closed:

* "execute" or "change" - Both events single that the dropdown has executed, for
  example the user clicked a menu-item or clicked "OK" on a dialog.
* "cancel" - Signals that the user canceled the dropdown; it's typically
  from the "Cancel" button on a dialog.

`delite/popup` will monitor for these two events and inform the parent widget when either of them is executed.

Here’s an example from a pop-up widget that triggers onExecute when it’s been clicked:

```js
onItemClick: function(/*Widget*/ item, /*Event*/ evt){
	...
	// before calling user defined handler, close hierarchy of menus
	// and restore focus to place it was when menu was opened
	this.emit("execute");

	// user defined handler for click
	item.onClick(evt);
	...
}
```

### Popup Widget CSS

Popup widgets should display a scroll bar if necessary if their height (or width) is reduced.
The height/width may be reduced so that the popup fits within the viewport.

Displaying a scroll bar can be handled by:

* setting `overflow: auto` CSS on the root node
* using flexbox styling and setting `overflow: auto` on a child node
* extending [`delite/Scrollable`](Scrollable.md)


## Lifecycle

The lifecycle of a pop-up widget looks like this:

1. Parent widget calls `popup.open` to display the pop-up, passing `onExecute` and `onCancel` callbacks
   for when it needs to close
2. User interacts with the pop-up, causing `this.onExecute()` or `this.onCancel()` to be called on the pop-up widget
3. delite/popup code notices the `onExecute`/`onCancel` method has been called and informs the parent widget by
   calling the `onExecute` function defined in the `popup.open` call
4. Parent widget calls `popup.close`, which closes the pop-up
5. `popup.close` calls the `onClose` callback defined in the original `popup.open` call

If the user clicks a blank section of the screen in order to close the pop-up instead of interacting with the widget,
then the ending steps of the lifecycle are slightly different:

1. delite/popup code notices the click on the blank area of the screen
2. delite/popup code doesn’t close the pop-up widget directly, but rather calls the `onCancel` callback
   from the original `popup.open` call
3. Parent widget calls `popup.close`, which closes the pop-up

## Stacks

Pop-ups can open other pop-ups.
This ability is leveraged heavily by menus.
To facilitate this, delite/popup keeps track of the entire stack of open pop-ups.
In the case when a hierarchy of pop-ups all need to be closed at once,
calling `popup.close` on the top-most pop-up will close all child pop-ups.
This means that parent widgets do not need to maintain their own stack of pop-ups in order to ensure
that they can clean up properly after themselves.

## Keyboard handling

delite/popup automatically listens for key presses on the ESC key as a way to cancel the highest pop-up
and return to the parent node (which may itself be a pop-up).
When the ESC key is pressed, the `onCancel` callback passed in the call to `popup.open` is called.
delite/popup also listens for the TAB key, and if it sees it, the entire stack of pop-ups is cancelled
(in the case of menus, where one pop-up has opened another and so forth).

Note that in neither of these cases does the delite/popup code directly close any pop-ups.
It just calls the `onCancel` callback defined in the call to `popup.open`.
That callback then is responsible for calling `popup.close(popupWidget)`.

## Popup DOM node positioning

`popup.moveOffScreen` should be called on any nodes that will be used as pop-ups.
Its main function, besides hiding the node, is to attach it as a direct child of `<body>`.
The reason this is done is to ensure the node doesn’t get cut off if it is inside a `<div>` with a short height.
(For example, given a button inside a TabContainer,
the pop-up might want to overflow past the bottom of the TabContainer.)

Note that this design decision makes TAB key handling particularly difficult, and it’s not handled perfectly:
if a user hits the TAB key while on a sub-menu of a MenuBar, or any drop down from a DropDownButton,
they probably expect the focus to go to the next element after the MenuBar/DropDownButton.
However, since the drop-down has actually been repositioned as the last element in `<body>`,
just letting the browser handle the TAB key won't do what the user expects.

As a compromise, the TAB key (while focus is on a pop-up) will re-focus on the DropDownButton/MenuBarItem
that spawned the top pop-up.
This is handled by the code that calls `popup.open`, in the return handler for `onCancel`.


## See Also

- [`delite/HasDropDown`](HasDropDown.md)
