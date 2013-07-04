var categories = [
	{ tag: "Accordion", label: "Accordion"},
	{ tag: "Badge", label: "Badge"},
	{ tag: "Button", label: "Button"},
	{ tag: "ContentPane", label: "ContentPane"},
	{ tag: "DatePicker", label: "DatePicker"},
	{ tag: "EdgeToEdgeCategory", label: "EdgeToEdgeCategory"},
	{ tag: "EdgeToEdgeList", label: "EdgeToEdgeList"},
	{ tag: "EdgeToEdgeStoreList", label: "EdgeToEdgeStoreList"},
	{ tag: "FixedSplitter", label: "FixedSplitter"},
	{ tag: "FormControls", label: "FormControls"},
	{ tag: "GridLayout", label: "GridLayout"},
	{ tag: "Heading", label: "Heading"},
	{ tag: "Icon", label: "Icon"},
	{ tag: "IconContainer", label: "IconContainer"},
	{ tag: "IconMenu", label: "IconMenu"},
	{ tag: "ListItem", label: "ListItem"},
	{ tag: "Media", label: "Media"},
	{ tag: "Opener", label: "Opener"},
	{ tag: "ProgressIndicator", label: "ProgressIndicator"},
	{ tag: "Rating", label: "Rating"},
	{ tag: "RoundRect", label: "RoundRect"},
	{ tag: "RoundRectList", label: "RoundRectList"},
	{ tag: "ScrollablePane", label: "ScrollablePane"},
	{ tag: "ScrollableView", label: "ScrollableView"},
	{ tag: "SimpleDialog", label: "SimpleDialog"},
	{ tag: "SpinWheel", label: "SpinWheel"},
	{ tag: "SwapView", label: "SwapView"},
	{ tag: "Switch", label: "Switch"},
	{ tag: "TabBar", label: "TabBar"},
	{ tag: "TimePicker", label: "TimePicker"},
	{ tag: "ToolBarButton", label: "ToolBarButton"},
	{ tag: "TreeView", label: "TreeView"},
	{ tag: "ValuePicker", label: "ValuePicker"},
	{ tag: "bookmarkable", label: "bookmarkable"},
	{ tag: "domButton", label: "domButton"},
	{ tag: "dynamic", label: "dynamic"},
	{ tag: "misc", label: "misc"},
	{ tag: "transition", label: "transition"},
	{ tag: "FilteredLists", label: "FilteredLists"},
	{ tag: "TemplatedWidgets", label: "TemplatedWidgets"}
];

var priority = { high: "High", medium: "Medium", low: "Low" };
var tests = [
	{ url: "test_Accordion-demo.html", tags: "Accordion" , priority: priority.high },
	{ url: "test_Audio-single-source.html", tags: "Media" },
	{ url: "test_Audio.html", tags: "Media", priority: priority.high },
	{ url: "test_Badge.html", tags: "Badge", priority: priority.high },
	{ url: "test_Button.html", tags: "Button", priority: priority.high },
	{ url: "test_Calendar.html", tags: "misc", priority: priority.high },
	{ url: "test_ComboBox-sv.html", tags: "FormControls" },
	{ url: "test_ComboBox-widepage.html", tags: "FormControls" },
	{ url: "test_ComboBox.html", tags: "FormControls", priority: priority.high },
	{ url: "test_ContentPane.html", tags: "ContentPane", priority: priority.high },
	{ url: "test_DatePicker.html", tags: "DatePicker", priority: priority.high },
	{ url: "test_DatePicker2.html", tags: "DatePicker" },
	{ url: "test_EdgeToEdgeCategory.html", tags: "EdgeToEdgeCategory", priority: priority.high },
	{ url: "test_EdgeToEdgeList-check.html", tags: "EdgeToEdgeList" },
	{ url: "test_EdgeToEdgeList-editable-a11y.html", tags: "EdgeToEdgeList" },
	{ url: "test_EdgeToEdgeList-editable-sv.html", tags: "EdgeToEdgeList" },
	{ url: "test_EdgeToEdgeList-editable.html", tags: "EdgeToEdgeList", priority: priority.medium },
	{ url: "test_EdgeToEdgeList-syncWithViews.html", tags: "EdgeToEdgeList" },
	{ url: "test_EdgeToEdgeList-variable.html", tags: "EdgeToEdgeList"},
	{ url: "test_EdgeToEdgeList.html", tags: "EdgeToEdgeList", priority: priority.high },
	{ url: "test_EdgeToEdgeStoreList-auto-sv.html", tags: "EdgeToEdgeStoreList" },
	{ url: "test_EdgeToEdgeStoreList-auto-v.html", tags: "EdgeToEdgeStoreList" },
	{ url: "test_EdgeToEdgeStoreList-categ.html", tags: "EdgeToEdgeStoreList" },
	{ url: "test_EdgeToEdgeStoreList-itemMap.html", tags: "EdgeToEdgeStoreList"},
	{ url: "test_EdgeToEdgeStoreList-itemMap-updates.html", tags: "EdgeToEdgeStoreList"},
	{ url: "test_EdgeToEdgeStoreList-lazy.html", tags: "EdgeToEdgeStoreList"},
	{ url: "test_EdgeToEdgeStoreList-more-sv.html", tags: "EdgeToEdgeStoreList" },
	{ url: "test_EdgeToEdgeStoreList-more-v.html", tags: "EdgeToEdgeStoreList" },
	{ url: "test_EdgeToEdgeStoreList.html", tags: "EdgeToEdgeStoreList", priority: priority.high },
	{ url: "test_FixedSplitter-H2-prog.html", tags: "FixedSplitter" },
	{ url: "test_FixedSplitter-H2.html", tags: "FixedSplitter" },
	{ url: "test_FixedSplitter-V2H2-ContentPane.html", tags: "FixedSplitter" },
	{ url: "test_FixedSplitter-V2H2-change.html", tags: "FixedSplitter" },
	{ url: "test_FixedSplitter-V2H2.html", tags: "FixedSplitter" },
	{ url: "test_FixedSplitter-V3-var0.html", tags: "FixedSplitter" },
	{ url: "test_FixedSplitter-V3-var1.html", tags: "FixedSplitter" },
	{ url: "test_FixedSplitter-V3-var2.html", tags: "FixedSplitter" },
	{ url: "test_FixedSplitter-V3.html", tags: "FixedSplitter" },
	{ url: "test_FixedSplitter-orientation.html", tags: "FixedSplitter" },
	{ url: "test_FormControls.html", tags: "FormControls", priority: priority.high },
	{ url: "test_FormLayout.html", tags: "FormControls", priority: priority.high},
	{ url: "test_GridLayout-2cols.html", tags: "GridLayout"},
	{ url: "test_GridLayout-3cols.html", tags: "GridLayout"},
	{ url: "test_GridLayout-change.html", tags: "GridLayout"},
	{ url: "test_GridLayout-demo.html", tags: "GridLayout", priority: priority.high},
	{ url: "test_Heading.html", tags: "Heading", priority: priority.high },
	{ url: "test_Icon.html", tags: "Icon", priority: priority.high },
	{ url: "test_IconContainer-badge.html", tags: "IconContainer" },
	{ url: "test_IconContainer-connect.html", tags: "IconContainer" },
	{ url: "test_IconContainer-editable-a11y.html", tags: "IconContainer" },
	{ url: "test_IconContainer-editable.html", tags: "IconContainer" },
	{ url: "test_IconContainer-highlight.html", tags: "IconContainer" },
	{ url: "test_IconContainer-multi.html", tags: "IconContainer" },
	{ url: "test_IconContainer-prog.html", tags: "IconContainer" },
	{ url: "test_IconContainer-pubsub.html", tags: "IconContainer" },
	{ url: "test_IconContainer-removeConfirmation.html", tags: "IconContainer" },
	{ url: "test_IconContainer-single-below.html", tags: "IconContainer" },
	{ url: "test_IconContainer-single.html", tags: "IconContainer" },
	{ url: "test_IconContainer-sprite.html", tags: "IconContainer" },
	{ url: "test_IconContainer-transition-below.html", tags: "IconContainer" },
	{ url: "test_IconContainer-transition-zoom.html", tags: "IconContainer" },
	{ url: "test_IconContainer.html", tags: "IconContainer", priority: priority.high },
	{ url: "test_IconMenu-6up.html", tags: "IconMenu" },
	{ url: "test_IconMenu-programmatic.html", tags: "IconMenu" },
	{ url: "test_IconMenu-standalone.html", tags: "IconMenu", priority: priority.high },
	{ url: "test_ListItem-actions.html", tags: "ListItem", priority: priority.high },
	{ url: "test_ListItem-button.html", tags: "ListItem" },
	{ url: "test_ListItem-domButtons.html", tags: "ListItem" },
	{ url: "test_ListItem-layout.html", tags: "ListItem" },
	{ url: "test_ListItem-sprite.html", tags: "ListItem" },
	{ url: "test_ListItem-transOpt.html", tags: "ListItem" },
	{ url: "test_Opener-ActionSheet-async.html", tags: "Opener" },
	{ url: "test_Opener-Calendar-lazy-prog.html", tags: "Opener" },
	{ url: "test_Opener-Calendar-lazy.html", tags: "Opener" },
	{ url: "test_Opener-Calendar.html", tags: "Opener", priority: priority.high },
	{ url: "test_Opener-ColorPalette-lazy.html", tags: "Opener" },
	{ url: "test_Opener-ColorPalette.html", tags: "Opener" },
	{ url: "test_Opener-DateSpinWheel-lazy.html", tags: "Opener" },
	{ url: "test_Opener-DateSpinWheel.html", tags: "Opener" },
	{ url: "test_Opener-RoundSelectList-async.html", tags: "Opener" },
	{ url: "test_Opener-SearchList-async.html", tags: "Opener" },
	{ url: "test_Overlay.html", tags: "Opener", priority: priority.high },
	{ url: "test_ProgressBar.html", tags: "ProgressBar", priority: priority.high },
	{ url: "test_ProgressIndicator-color.html", tags: "ProgressIndicator" },
	{ url: "test_ProgressIndicator-heading.html", tags: "ProgressIndicator" },
	{ url: "test_ProgressIndicator-list.html", tags: "ProgressIndicator" },
	{ url: "test_ProgressIndicator-size.html", tags: "ProgressIndicator" },
	{ url: "test_ProgressIndicator.html", tags: "ProgressIndicator", priority: priority.high },
	{ url: "test_Rating-prog.html", tags: "Rating" },
	{ url: "test_Rating-setter.html", tags: "Rating" },
	{ url: "test_Rating.html", tags: "Rating", priority: priority.high },
	{ url: "test_RoundRect.html", tags: "RoundRect", priority: priority.high },
	{ url: "test_RoundRectCategory.html", tags: "RoundRectList", priority: priority.high },
	{ url: "test_RoundRectList-check.html", tags: "RoundRectList" },
	{ url: "test_RoundRectList-editable-sv.html", tags: "RoundRectList" },
	{ url: "test_RoundRectList-editable.html", tags: "RoundRectList", priority: priority.medium },
	{ url: "test_RoundRectList-icons.html", tags: "RoundRectList" },
	{ url: "test_RoundRectList-inherit.html", tags: "RoundRectList" },
	{ url: "test_RoundRectList-variable.html", tags: "RoundRectList"},
	{ url: "test_RoundRectList-vh-icons.html", tags: "RoundRectList" },
	{ url: "test_RoundRectList.html", tags: "RoundRectList", priority: priority.high },
	{ url: "test_RoundRectStoreList.html", tags: "RoundRectList", priority: priority.high },
	{ url: "test_ScrollableMixin-custom.html", tags: "ScrollableView" },
	{ url: "test_ScrollablePane-demo.html", tags: "ScrollablePane", priority: priority.high },
	{ url: "test_ScrollablePane-h.html", tags: "ScrollablePane" },
	{ url: "test_ScrollablePane-mask.html", tags: "ScrollablePane" },
	{ url: "test_ScrollablePane.html", tags: "ScrollablePane" },
	{ url: "test_ScrollableView-demo-long.html", tags: "ScrollableView", priority: priority.high },
	{ url: "test_ScrollableView-demo.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-h.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-hv-ah-af.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-hv-vh-vf.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-hv.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-short-inp.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-short.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v-ah-af-inp.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v-ah-af.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v-ah-inp.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v-inp.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v-vh-af-inp.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v-vh-af.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v-vh-inp.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v-vh-vf-inp.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v-vh-vf.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v-vh.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-v.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-scrollEvents.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-pullToRefresh.html", tags: "ScrollableView" },
	{ url: "test_ScrollableView-fixedFooters.html", tags: "ScrollableView" },
	{ url: "test_SimpleDialog-large.html", tags: "SimpleDialog" },
	{ url: "test_SimpleDialog-load.html", tags: "SimpleDialog" },
	{ url: "test_SimpleDialog-spinWheel.html", tags: "SimpleDialog" },
	{ url: "test_SimpleDialog.html", tags: "SimpleDialog", priority: priority.high },
	{ url: "test_Slider.html", tags: "FormControls", priority: priority.high },
	{ url: "test_SpinWheel-1slot.html", tags: "SpinWheel" },
	{ url: "test_SpinWheel-custom.html", tags: "SpinWheel" },
	{ url: "test_SpinWheel-icons.html", tags: "SpinWheel" },
	{ url: "test_SpinWheelDatePicker-setter.html", tags: "SpinWheel" },
	{ url: "test_SpinWheelDatePicker-sv.html", tags: "SpinWheel" },
	{ url: "test_SpinWheelDatePicker.html", tags: "SpinWheel" },
	{ url: "test_SpinWheelTimePicker-setter.html", tags: "SpinWheel" },
	{ url: "test_SpinWheelTimePicker.html", tags: "SpinWheel", priority: priority.high },
	{ url: "test_SwapView-demo.html", tags: "SwapView", priority: priority.high },
	{ url: "test_SwapView-slideshow.html", tags: "SwapView", priority: priority.medium },
	{ url: "test_SwapView.html", tags: "SwapView", priority: priority.medium },
	{ url: "test_SwapView-show.html", tags: "SwapView", priority: priority.medium },
	{ url: "test_Switch-setter.html", tags: "Switch" },
	{ url: "test_Switch.html", tags: "Switch", priority: priority.high },
	{ url: "test_TabBar-badge.html", tags: "TabBar" },
	{ url: "test_TabBar-seg-grouped-scroll.html", tags: "TabBar" },
	{ url: "test_TabBar-seg-grouped.html", tags: "TabBar" },
	{ url: "test_TabBar-seg.html", tags: "TabBar" },
	{ url: "test_TabBar-syncWithViews.html", tags: "TabBar" },
	{ url: "test_TabBar.html", tags: "TabBar", priority: priority.high },
	{ url: "test_TimePicker.html", tags: "TimePicker" },
	{ url: "test_ToolBarButton-setter.html", tags: "ToolBarButton" },
	{ url: "test_Tooltip.html", tags: "Opener", priority: priority.high },
	{ url: "test_TreeView.html", tags: "TreeView", priority: priority.medium },
	{ url: "test_ValuePicker-1slot.html", tags: "ValuePicker" },
	{ url: "test_ValuePicker-custom.html", tags: "ValuePicker" },
	{ url: "test_ValuePicker-dialog.html", tags: "ValuePicker" },
	{ url: "test_ValuePickerDatePicker-setter.html", tags: "ValuePicker" },
	{ url: "test_ValuePickerDatePicker.html", tags: "ValuePicker", priority: priority.high },
	{ url: "test_ValuePickerSlot.html", tags: "ValuePicker" },
	{ url: "test_ValuePickerTimePicker-setter.html", tags: "ValuePicker" },
	{ url: "test_ValuePickerTimePicker.html", tags: "ValuePicker", priority: priority.high },
	{ url: "test_Video-single-source.html", tags: "Media" },
	{ url: "test_Video.html", tags: "Media", priority: priority.high },

	{ url: "test_a11y.html", tags: "misc", priority: priority.high },
	{ url: "test_add-to-home-screen-sample.html", tags: "misc" },
	{ url: "test_ajax-html-sync.html", tags: "misc" },
	{ url: "test_ajax-html.html", tags: "misc" },
	{ url: "test_ajax-json-sync.html", tags: "misc" },
	{ url: "test_ajax-json.html", tags: "misc" },
	{ url: "test_anchor-label.html", tags: "misc" },
	{ url: "test_bg-view.html", tags: "misc" },
	{ url: "test_bg.html", tags: "misc" },
	{ url: "test_data-handlers.html", tags: "transition" },
	{ url: "test_domButtons.html", tags: "domButton" },
	{ url: "test_domButtons16.html", tags: "domButton" },
	{ url: "test_domButtonsBadge.html", tags: "domButton" },
	{ url: "test_dynamic-ScrollableView-ah-af.html", tags: "dynamic", priority: priority.medium },
	{ url: "test_dynamic-ScrollableView-vh-vf.html", tags: "dynamic" },
	{ url: "test_dynamic-icons.html", tags: "dynamic" },
	{ url: "test_dynamic-items.html", tags: "dynamic" },
	{ url: "test_grouped-scrollable-views.html", tags: "misc" },
	{ url: "test_grouped-views.html", tags: "misc" },
	{ url: "test_hash-parameter.html", tags: "misc" },
	{ url: "test_html-form-controls.html", tags: "misc" },
	{ url: "test_html-inputs.html", tags: "misc" },
	{ url: "test_new_transition-animations-standard.html", tags: "transition" },
	{ url: "test_new_transition-animations.html", tags: "transition" },
	{ url: "test_new_transition-animations2.html", tags: "transition" },
	{ url: "test_orientation-transition.html", tags: "misc" },
	{ url: "test_phone-settings.html", tags: "misc" },
	{ url: "test_tablet-settings.html", tags: "misc" },
	{ url: "test_theme-switch.html", tags: "misc" },
	{ url: "test_theme-iOS6.html", tags: "misc" },
	{ url: "test_transition-animations-extended1.html", tags: "transition" },
	{ url: "test_transition-animations-extended2.html", tags: "transition" },
	{ url: "test_transition-animations-extended3.html", tags: "transition" },
	{ url: "test_transition-animations-extended4.html", tags: "transition" },
	{ url: "test_transition-animations-extended5.html", tags: "transition" },
	{ url: "test_transition-animations-standard.html", tags: "transition" },
	{ url: "test_transition-animations.html", tags: "transition" },
	{ url: "test_transition-animations2.html", tags: "transition" },
	{ url: "test_transition-connect.html", tags: "transition" },
	{ url: "test_transition-pubsub.html", tags: "transition" },
	{ url: "test_FilteredList-EdgeToEdgeStoreList-auto.html", tags: "FilteredLists", priority: priority.medium },
	{ url: "test_FilteredList-EdgeToEdgeStoreList-auto-prog.html", tags: "FilteredLists" },
	{ url: "test_FilteredList-EdgeToEdgeStoreList-demo.html", tags: "FilteredLists", priority: priority.high },
	{ url: "test_FilteredList-EdgeToEdgeStoreList-prog.html", tags: "FilteredLists", priority: priority.medium },
	{ url: "test_FilteredList-EdgeToEdgeStoreList-simple.html", tags: "FilteredLists" },
	{ url: "test_FilteredList-RoundRectList-auto.html", tags: "FilteredLists" , priority: priority.medium},
	{ url: "test_FilteredList-RoundRectList-demo.html", tags: "FilteredLists", priority: priority.high },
	{ url: "test_LongListMixin.html", tags: "ScrollableView", priority: priority.high },
	{ url: "test_Templated-widgets.html", tags: "TemplatedWidgets", priority: priority.high }
];
