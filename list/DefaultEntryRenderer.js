define(["dcl/dcl",
        "dui/register",
        "dojo/dom-construct",
        "dojo/dom-class",
        "./AbstractEntryRenderer"
], function (dcl, register, domConstruct, domClass, AbstractEntryRenderer) {
	
	var DefaultEntryRenderer = dcl([AbstractEntryRenderer], {

		renderEntry: function (entry) {
			this._renderTextNode("labelNode", entry ? entry.label : null, "duiListEntryLabel");
			this._renderImageNode("iconNode", entry ? entry.icon : null, "duiListEntryIcon");
			this._renderTextNode("rightText", entry ? entry.rightText : null, "duiListEntryRightText");
			this._renderImageNode("rightIcon2", entry ? entry.rightIcon2 : null, "duiListEntryRightIcon2");
			this._renderImageNode("rightIcon", entry ? entry.rightIcon : null, "duiListEntryRightIcon");
			this._setFocusableChildren(["iconNode", "labelNode", "rightText", "rightIcon2", "rightIcon"]);
		},

		_renderTextNode: function (nodeName, text, nodeClass) {
			if (text) {
				if (this[nodeName]) {
					this[nodeName].innerHTML = text;
				} else {
					this[nodeName] = domConstruct.create("DIV",
							{id: this.id + nodeName, innerHTML: text, class: nodeClass, tabindex: -1},
							this.containerNode, 0);
				}
			} else {
				if (this[nodeName]) {
					this[nodeName].parentNode.removeChild(this[nodeName]);
					delete this[nodeName];
				}
			}
		},

		_renderImageNode: function (nodeName, image, nodeClass) {
			if (image) {
				if (this[nodeName]) {
					if (this[nodeName].getAttribute("src") !== image) {
						this[nodeName].src = image;
					}
				} else {
					this[nodeName] = domConstruct.create("IMG",
							{id: this.id + nodeName, src: image, class: nodeClass, tabindex: -1},
							this.containerNode, 0);
				}
			} else {
				if (this[nodeName]) {
					this[nodeName].parentNode.removeChild(this[nodeName]);
					delete this[nodeName];
				}
			}
		}

	});

	return register("d-list-entry", [HTMLElement, DefaultEntryRenderer]);
});