define(function(){ return '\
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