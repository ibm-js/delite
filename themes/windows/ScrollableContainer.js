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
.duiScrollableContainer {\
  /* used to have bad effect on iOS 5; fixed in iOS 6. */\
\
  -webkit-overflow-scrolling: touch;\
  /* enable hardware accelaration - TODO final choices to be made after testing, later */\
\
  -webkit-transform: translate3d(0, 0, 0);\
  -webkit-transform-style: preserve-3d;\
}\
'; } );
