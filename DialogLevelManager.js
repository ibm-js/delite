// Old DialogLevelManager code from dijit, preserved here since it might be useful in delite too.
// Highly related to popup.js
define([], function (domClass, domStyle, DialogUnderlay) {

	var DialogLevelManager = {
		// summary:
		//		Controls the various active "levels" on the page, starting with the
		//		stuff initially visible on the page (at z-index 0), and then having an entry for
		//		each Dialog shown.

		_beginZIndex: 950,

		show: function (/*Element*/ dialog, /*Object*/ underlayAttrs) {
			// summary:
			//		Call right before fade-in animation for new dialog.
			//		Saves current focus, displays/adjusts underlay for new dialog,
			//		and sets the z-index of the dialog itself.
			//
			//		New dialog will be displayed on top of all currently displayed dialogs.
			//
			//		Caller is responsible for setting focus in new dialog after the fade-in
			//		animation completes.

			// Save current focus
			ds[ds.length - 1].focus = focus.curNode;

			// Set z-index a bit above previous dialog
			var zIndex = ds[ds.length - 1].dialog ? ds[ds.length - 1].zIndex + 2 : DialogLevelManager._beginZIndex;
			dialog.style.zIndex = zIndex;

			// Display the underlay, or if already displayed then adjust for this new dialog
			DialogUnderlay.show(underlayAttrs, zIndex - 1);

			ds.push({dialog: dialog, underlayAttrs: underlayAttrs, zIndex: zIndex});
		},

		hide: function (/*Element*/ dialog) {
			// summary:
			//		Called when the specified dialog is hidden/destroyed, after the fade-out
			//		animation ends, in order to reset page focus, fix the underlay, etc.
			//		If the specified dialog isn't open then does nothing.
			//
			//		Caller is responsible for either setting display:none on the dialog domNode,
			//		or calling dui/popup.hide(), or removing it from the page DOM.

			if (ds[ds.length - 1].dialog === dialog) {
				// Removing the top (or only) dialog in the stack, return focus
				// to previous dialog

				ds.pop();

				var pd = ds[ds.length - 1];	// the new active dialog (or the base page itself)

				// Adjust underlay
				if (ds.length === 1) {
					// Returning to original page.  Hide the underlay.
					DialogUnderlay.hide();
				} else {
					// Popping back to previous dialog, adjust underlay.
					DialogUnderlay.show(pd.underlayAttrs, pd.zIndex - 1);
				}

				// Adjust focus.
				// TODO: regardless of setting of dialog.refocus, if the exeucte() method set focus somewhere,
				// don't shift focus back to button.  Note that execute() runs at the start of the fade-out but
				// this code runs later, at the end of the fade-out.  Menu has code like this.
				if (dialog.refocus) {
					// If we are returning control to a previous dialog but for some reason
					// that dialog didn't have a focused field, set focus to first focusable item.
					// This situation could happen if two dialogs appeared at nearly the same time,
					// since a dialog doesn't set it's focus until the fade-in is finished.
					var focus = pd.focus;
					if (pd.dialog && (!focus || !pd.dialog.contains(focus))) {
						pd.dialog._getFocusItems(pd.dialog.domNode);
						focus = pd.dialog._firstFocusItem;
					}

					if (focus) {
						// Refocus the button that spawned the Dialog.   This will fail in corner cases including
						// page unload on IE, because the dui/form/Button that launched the Dialog may get destroyed
						// before this code runs.  (#15058)
						try {
							focus.focus();
						} catch (e) {
						}
					}
				}
			} else {
				// Removing a dialog out of order (#9944, #10705).
				// Don't need to mess with underlay or z-index or anything.
				var idx = ds.map(function (elem) {
					return elem.dialog;
				}).indexOf(dialog);
				if (idx !== -1) {
					ds.splice(idx, 1);
				}
			}
		},

		isTop: function (/*dui/Widget*/ dialog) {
			// summary:
			//		Returns true if specified Dialog is the top in the task
			return ds[ds.length - 1].dialog === dialog;
		}
	};

	// Stack representing the various active "levels" on the page, starting with the
	// stuff initially visible on the page (at z-index 0), and then having an entry for
	// each Dialog shown.
	// Each element in stack has form {
	//		dialog: dialogWidget,
	//		focus: returnFromGetFocus(),
	//		underlayAttrs: attributes to set on underlay (when this widget is active)
	// }
	var ds = DialogLevelManager._dialogStack = [
		{dialog: null, focus: null, underlayAttrs: null}    // entry for stuff at z-index: 0
	];

	// If focus was accidentally removed from the dialog, such as if the user clicked a blank
	// area of the screen, or clicked the browser's address bar and then tabbed into the page,
	// then refocus.   Won't do anything if focus was removed because the Dialog was closed, or
	// because a new Dialog popped up on top of the old one, or when focus moves to popups
	document.addEventListener("focus", function (evt) {
		var node = evt.target;

		// Note: if no dialogs, ds.length==1 but ds[ds.length-1].dialog is null
		var topDialog = ds[ds.length - 1].dialog;

		// If a node was focused, and there's a Dialog currently showing, and not in the process of fading out...
		// Ignore focus events on other document though because it's likely an Editor inside of the Dialog.
		if (node && topDialog && !topDialog._fadeOutDeferred && node.ownerDocument === topDialog.ownerDocument) {
			// If the node that was focused is inside the dialog or in a popup, even a context menu that isn't
			// technically a descendant of the the dialog, don't do anything.
			do {
				if (node === topDialog.domNode || domClass.contains(node, "duiPopup")) {
					return;
				}
			} while ((node = node.parentNode));

			// Otherwise, return focus to the dialog.  Use a delay to avoid confusing dui/focus code's
			// own tracking of focus.
			topDialog.focus();
		}
	}, true);

	return DialogLevelManager;
});
