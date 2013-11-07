define(function(){ return '\
.mblSidePane {\
  width: 15em;\
  height: 100%;\
  top: 0;\
  box-sizing: border-box;\
  position: fixed;\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.noSelect {\
  -webkit-touch-callout: none;\
  -webkit-user-select: none;\
  -khtml-user-select: none;\
  -moz-user-select: none;\
  -ms-user-select: none;\
  user-select: none;\
}\
.mblSidePaneStart {\
  left: 0;\
  border-right: solid black 1px;\
}\
.mblSidePaneEnd {\
  right: 0;\
  border-left: solid black 1px;\
}\
.mblSidePaneStartPushHiddenPane,\
.mblSidePaneStartOverlayHiddenPane {\
  -webkit-transform: translate3d(-15em, 0px, 0px);\
  transform: translate3d(-15em, 0px, 0px);\
}\
.mblSidePaneStartPushVisiblePane,\
.mblSidePaneStartOverlayVisiblePane {\
  display: "";\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
}\
.mblSidePaneEndPushHiddenPane,\
.mblSidePaneEndOverlayHiddenPane {\
  right: 0;\
  -webkit-transform: translate3d(15em, 0px, 0px);\
  transform: translate3d(15em, 0px, 0px);\
}\
.mblSidePaneEndPushVisiblePane,\
.mblSidePaneEndOverlayVisiblePane {\
  display: "";\
  right: 0;\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
}\
.mblSidePaneStartPushHiddenPage {\
  -webkit-transform: translate3d(15em, 0px, 0px);\
  transform: translate3d(15em, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.mblSidePaneStartPushVisiblePage {\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.mblSidePaneEndPushHiddenPage {\
  -webkit-transform: translate3d(-15em, 0px, 0px);\
  transform: translate3d(-15em, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.mblSidePaneEndPushVisiblePage {\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.mblSidePaneEndRevealVisiblePane,\
.mblSidePaneEndRevealHiddenPane {\
  right: 0;\
}\
'; } );
