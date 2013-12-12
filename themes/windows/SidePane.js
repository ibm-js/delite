define(function(){ return '\
.duiToolBarButtonHasArrow-styles {\
  width: 27px;\
  height: 27px;\
  border-radius: 20px;\
  border: 2px solid #ffffff;\
  padding: 0px;\
  margin: 0px;\
  margin-top: 8px;\
  margin-bottom: 8px;\
  background-image: url("images/dark/back.png");\
  background-position: 50% 50%;\
  background-size: 27px 27px;\
  background-repeat: no-repeat;\
}\
.d-side-pane {\
  width: 15em;\
  height: 100%;\
  top: 0;\
  box-sizing: border-box;\
  position: fixed;\
  background-color: white;\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.-d-side-pane-no-select {\
  -webkit-touch-callout: none;\
  -webkit-user-select: none;\
  -khtml-user-select: none;\
  -moz-user-select: none;\
  -ms-user-select: none;\
  user-select: none;\
}\
.-d-side-pane-start {\
  left: 0;\
  border-right: solid black 1px;\
}\
.-d-side-pane-end {\
  right: 0;\
  border-left: solid black 1px;\
}\
.-d-side-pane-start-push-hidden-pane,\
.-d-side-pane-start-overlay-hidden-pane {\
  -webkit-transform: translate3d(-15em, 0px, 0px);\
  transform: translate3d(-15em, 0px, 0px);\
}\
.-d-side-pane-start-push-visible-pane,\
.-d-side-pane-start-overlay-visible-pane {\
  display: "";\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
}\
.-d-side-pane-end-push-hidden-pane,\
.-d-side-pane-end-overlay-hidden-pane {\
  right: 0;\
  -webkit-transform: translate3d(15em, 0px, 0px);\
  transform: translate3d(15em, 0px, 0px);\
}\
.-d-side-pane-end-push-visible-pane,\
.-d-side-pane-end-overlay-visible-pane {\
  display: "";\
  right: 0;\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
}\
.-d-side-pane-start-push-hidden-page {\
  -webkit-transform: translate3d(15em, 0px, 0px);\
  transform: translate3d(15em, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.-d-side-pane-start-push-visible-page {\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.-d-side-pane-end-push-hidden-page {\
  -webkit-transform: translate3d(-15em, 0px, 0px);\
  transform: translate3d(-15em, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.-d-side-pane-end-push-visible-page {\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.-d-side-pane-end-reveal-visible-pane,\
.-d-side-pane-end-reveal-hidden-pane {\
  right: 0;\
}\
'; } );
