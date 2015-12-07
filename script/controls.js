/* controls.js
 *
 * @author billgrace / http://billgrace.com
 *
 */

/*
 * general purpose, responsive controls.
 * an image "control" that allows a graphic image file to be displayed anywhere and in any shape or size
 * a pair of slider controls (one vertical and one horizontal) allowing numerical values to be adjusted by touch or mouse
 * a button that can be clicked or touched
 */

// textBox places a rectangle into a named HTML element.
// Text can be placed into the rectangle's "innerHTML".
// The color of the text and the background can be set.
// A border width and color can be set.
function textBox( startingText, leftPercent, topPercent, widthPercent, heightPercent,
					textcolor, textsize, backgroundcolor, borderwidth, bordercolor ) {
	var inst = this;
	// make a variable to allow the text box to become dormant
	this.dormant = true;
	// preserve the arguments
	this.startingText = startingText;
	this.leftPercent = leftPercent;
	this.topPercent = topPercent;
	this.widthPercent = widthPercent;
	this.heightPercent = heightPercent;
	this.textcolor = textcolor;
	this.textsize = textsize;
	this.backgroundcolor = backgroundcolor;
	this.borderwidth = borderwidth;
	this.bordercolor = bordercolor;
	// create the text box's positioning element
	this.visible = document.createElement( "div" );
	this.visible.style.cssText = "position:absolute;text-align:center;overflow:hidden;font-size:" + this.textsize + "vmin;border-style:solid";
	this.visible.style.color = this.textcolor;
	this.visible.style.backgroundColor = this.backgroundcolor;
	this.visible.style.borderWidth = "0" + this.borderwidth + "px";
	this.visible.style.borderColor = this.bordercolor;
	this.visible.innerHTML = this.startingText;
	document.body.appendChild( this.visible );

	// a routine to figure the geometry of this text box
	this.resize = function( leftPercent, topPercent, widthPercent, heightPercent ) {
		// readjust the text box geometry
		var windowWidth = window.innerWidth;
		var windowHeight = window.innerHeight;
		inst.visible.style.left = "0" + ( ( leftPercent * windowWidth ) | 0 ) + "px";
		inst.visible.style.top = "0" + ( ( topPercent * windowHeight ) | 0 ) + "px";
		inst.visible.style.width = "0" + ( ( widthPercent * windowWidth ) | 0 ) + "px";
		inst.visible.style.height = "0" + ( ( heightPercent * windowHeight ) | 0 ) + "px";
	}
	// an event handler to call the resizing routine whenever there's a change in browser geometry
	this.windowResizeHandler = function() {
		if( inst.dormant ) return;
		inst.resize( inst.leftPercent, inst.topPercent, inst.widthPercent, inst.heightPercent );
	}

	// a routine to update the text in the text box
	this.updateText = function( newText ) {
		if( inst.dormant ) return;
		inst.visible.innerHTML = newText;
	}

	// a routine to make the text box visible and responsive
	this.activate = function() {
		inst.dormant = false;
		inst.visible.style.display = "block";
		inst.windowResizeHandler();
	}
	// a routine to make the text box invisible and dormant
	this.deactivate = function() {
		inst.dormant = true;
		inst.visible.style.display = "none";
	}

	// at time of instantiation/creation, be dormant until activation is invoked
	this.deactivate();

	// add event listeners to invoke the resize handler
	window.addEventListener( "resize", this.windowResizeHandler, false );
	window.addEventListener( "orientationchange", this.windowResizeHandler, false );
};

// imageLabel places an image file into a named HTML element.
// The image is placed at a location and size/shape determined by percentage proportions of the dimensions of the browser window.
// When the window is resized, the image will distort as needed to retain the proportions.
function imageLabel ( imageFileName, leftPercent, topPercent, widthPercent, heightPercent ) {
	// make a persistent variable of this instance for later reference during event handling
	var inst = this;
	// make a variable allowing the label to become dormant
	this.dormant = true;
	// preserve the arguments
	this.imageFileName = imageFileName;
	this.leftPercent = leftPercent;
	this.topPercent = topPercent;
	this.widthPercent = widthPercent;
	this.heightPercent = heightPercent;
	// create the label's positioning element
	this.visible = document.createElement( "div" );
	this.visible.style.cssText = "position:absolute";
	document.body.appendChild( this.visible );
	// create the image element
	this.image = document.createElement( "img" );
	this.visible.appendChild( this.image );
	this.image.src = imageFileName;

	// figure the geometry of this label
	this.resize = function( leftPercent, topPercent, widthPercent, heightPercent ) {
		// readjust the label's geometry
		var windowWidth = window.innerWidth;
		var windowHeight = window.innerHeight;
		inst.image.style.left = inst.visible.style.left = "0" + ( ( leftPercent * windowWidth ) | 0 ) + "px";
		inst.image.style.top = inst.visible.style.top = "0" + ( ( topPercent * windowHeight ) | 0 ) + "px";
		inst.image.style.width = inst.visible.style.width = "0" + ( ( widthPercent * windowWidth ) | 0 ) + "px";
		inst.image.style.height = inst.visible.style.height = "0" + ( ( heightP * windowHeight ) | 0 ) + "px";
	}
	// an event handler to call the resizing routine whenever there's a change in browser geometry
	this.windowResizeHandler = function() {
		if( inst.dormant ) return;
		inst.resize( inst.leftPercent, inst.topPercent, inst.widthPercent, inst.heightPercent );
	}

	// a routine to make the label visible and responsive
	this.activate = function() {
		inst.dormant = false;
		inst.visible.style.display = "block";
		inst.windowResizeHandler();
	}
	// a routine to make the label invisible and dormant
	this.deactivate = function() {
		inst.dormant = true;
		inst.visible.style.display = "none";
	}

	// at time of instantiation/creation, be dormant until activation is invoked
	this.deactivate();

	// add event listeners to invoke the resize handler
	window.addEventListener( "resize", this.windowResizeHandler, false );
	window.addEventListener( "orientationchange", this.windowResizeHandler, false );
};

// horizontalSlider creates a left-right slide control within a named HTML element.
// The control is meant to visually resemble a slider-type level control on a typical sound board in appearance and use.
// The control's track location and size are determined by percentage proportions of the browser window.
// The control's sliding "knob" is rendered from a graphic image file. The height of the slider is determined by a percentage of the
//   height of the browser window and the width of the slider is determined by maintaining the original aspect ratio of the graphic image.
// An event handler routine is invoked whenever the slider position is changed.
function horizontalSlider( sliderImageFileName, leftLimitPercent, verticalCenterPercent, limitToLimitPercent, sliderHeightPercent, trackHeightPercent, trackColor, leftLimitValue, rightLimitValue, startingValue, changeHandler ) {
	// make a persistent variable of this instance for later reference during event handling
	var inst = this;
	// make a variable allowing the label to become dormant
	this.dormant = true;
	// preserve the arguments
	this.sliderImageFileName = sliderImageFileName;
	this.trackColor = trackColor;
	this.leftLimitValue = leftLimitValue;
	this.rightLimitValue = rightLimitValue;
	this.currentValue = startingValue;
	this.sliderHeightPercent = sliderHeightPercent;
	this.trackHeightPercent = trackHeightPercent;
	this.leftLimitPercent = leftLimitPercent;
	this.verticalCenterPercent = verticalCenterPercent;
	this.limitToLimitPercent = limitToLimitPercent;
	// establish some other handy values
	this.valueRange = rightValue - leftValue;
	this.leftLimitPixel = 0;
	this.rightLimitPixel = 0;
	this.motionPixelRange = 0;
	this.nowTracking = false;
	// create the control's visible elements
	this.track = document.createElement( "div" );
	this.track.style.cssText = "position:absolute;background-color:" + this.trackColor;
	document.body.appendChild( this.track );
	this.slider = document.createElement( "div" );
	this.slider.style.cssText = "position:absolute";
	document.body.appendChild( this.slider );
	this.imageElement = new Image();
	this.imageElement.onload = function() { inst.windowResizeHandler(); };
	this.imageElement.src = sliderImageFileName;
	this.slider.appendChild( this.imageElement );

	// a routine to figure the geometry of this control
	this.resize = function( leftLimitPercent, verticalCenterPercent, limitToLimitPercent, sliderRadiusPercent, trackRadiusPercent ) {
		var windowWidth = window.innerWidth;
		var windowHeight = window.innerHeight;
		// calculate the control's pixel geometry according to the specified proportions
		var trackLeft = ( ( leftLimitPercent - ( trackHeightPercent / 2 ) ) * windowWidth ) | 0;
		var trackTop = ( ( verticalCenterPercent - ( trackHeightPercent / 2 ) ) * windowHeight ) | 0;
		var trackWidth = ( ( limitToLimitPercent + trackHeightPercent ) * windowWidth ) | 0;
		var trackHeight = ( trackHeightPercent * windowHeight ) | 0;
		// calculate the slider image's natural aspect ratio
		var imageAspectRatio = inst.imageElement.naturalWidth / inst.imageElement.naturalHeight;
		// calculate the pixel positions of the end points of the slider's motion
		inst.leftLimitPixel = ( trackLeft + trackHeight / 2 ) | 0;
		inst.rightLimitPixel = (trackLeft + trackWidth - trackHeight / 2 ) | 0;
		// calculate the slider range in terms of equivalent pixels
		inst.motionPixelRange = inst.rightLimitPixel - inst.leftLimitPixel;
		// calculate the proportional height of the slider image and the necessary width to retain the image's aspect ratio
		var sliderHeight = ( sliderHeightPercent * windowHeight ) | 0;
		var sliderWidth = ( sliderHeight * imageAspectRatio ) | 0;
		// calculate the pixel location of the slider image according to present value
		var sliderLeft = ( inst.leftLimitPixel + ( inst.motionPixelRange * ( inst.currentValue / ( inst.rightLimitValue - inst.leftLimitValue ) ) ) - ( sliderWidth / 2 ) ) | 0;
		var sliderTop = ( ( verticalCenterPercent - ( sliderHeightPercent / 2 ) ) * windowHeight ) | 0;
		// set the calculated geometry into the control's elements
		inst.track.style.left = "0" + trackLeft + "px";
		inst.track.style.top = "0" + trackTop + "px";
		inst.track.style.width = "0" + trackWidth + "px";
		inst.track.style.height = "0" + trackHeight + "px";
		inst.track.style.borderRadius = "0" + ( ( trackHeight / 2 ) | 0 ) + "px";
		inst.imageElement.style.left = inst.slider.style.left = "0" + sliderLeft + "px";
		inst.imageElement.style.top = inst.slider.style.top = "0" + sliderTop + "px";
		inst.imageElement.style.width = inst.slider.style.width = "0" + sliderWidth + "px";
		inst.imageElement.style.height = inst.slider.style.height = "0" + sliderHeight + "px";
	}
	// an event handler to call the resizing routine whenever there's a change in browser geometry
	this.windowResizeHandler = function() {
		if( inst.dormant ) return;
		inst.resize( inst.leftLimitPercent, inst.verticalCenterPercent, inst.limitToLimitPercent, inst.sliderHeightPercent, inst.trackHeightPercent );
	}

	// a routine to make the control visible and responsive
	this.activate = function() {
		inst.dormant = false;
		inst.track.style.display = "block";
		inst.slider.style.display = "block";
		inst.windowResizeHandler();
	}
	// a routine to make the control invisible and dormant
	this.deactivate = function() {
		inst.dormant = true;
		inst.track.style.display = "none";
		inst.slider.style.display = "none";
	}

	// a routine to convert click/touch screen geometry into the equivalent slider value
	this.updateControlValue = function( pixelX ) {
		if( pixelX < inst.leftLimitPixel ) pixelX = inst.leftLimitPixel;
		if( pixelX > inst.rightLimitPixel ) pixelX = inst.rightLimitPixel;
		inst.currentValue = inst.leftLimitValue + inst.valueRange * ( pixelX - inst.leftLimitPixel ) / inst.motionPixelRange;
		inst.windowResizeHandler();
		changeHandler( inst.currentValue );
	}

	// handlers for mouse and touch events
	this.sliderMouseDownEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		// a click on the slider "grabs" the slider...
		inst.nowTracking = true;
		// and sets the slider's horizontal position to that of the point clicked
		inst.updateControlValue( e.clientX );
	}
	this.sliderMouseMoveEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		if( !inst.nowTracking ) return;
		// dragging with the mouse varies the slider's horizontal position
		inst.updateControlValue( e.clientX );
	}
	this.sliderMouseUpEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		// releasing the mouse button stops any further moving of the slider
		inst.nowTracking = false;
	}
	this.touchStartEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		// touching the slider "grabs" it...
		inst.nowTracking = true;
		// and sets the slider's horizontal position to that of the point touched
		inst.updateControlValue( e.touches[ 0 ].clientX );
	}
	this.touchMoveEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		if( !inst.nowTracking ) return;
		// dragging the slider varies its horizontal position
		inst.updateControlValue( e.touches[ 0 ].clientX );
	}
	this.touchEndEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		// lifting the touch finger stops any further moving of the slider
		inst.nowTracking = false;
	}

	// at time of instantiation/creation, be dormant until activation is invoked
	this.deactivate();

	// add event listeners to invoke the resize handler
	window.addEventListener( "resize", this.windowResizeHandler, false );
	window.addEventListener( "orientationchange", this.windowResizeHandler, false );
	// add event listeners to invoke the mouse/touch handlers
	this.track.addEventListener( "mousedown", this.sliderMouseDownEventHandler, false );
	this.slider.addEventListener( "mousedown", this.sliderMouseDownEventHandler, false );
	this.track.addEventListener( "mousemove", this.sliderMouseMoveEventHandler, false );
	this.slider.addEventListener( "mousemove", this.sliderMouseMoveEventHandler, false );
	window.addEventListener( "mouseup", this.sliderMouseUpEventHandler, false );
	this.track.addEventListener( "touchstart", this.touchStartEventHandler, false );
	this.slider.addEventListener( "touchstart", this.touchStartEventHandler, false );
	this.track.addEventListener( "touchmove", this.touchMoveEventHandler, false );
	this.slider.addEventListener( "touchmove", this.touchMoveEventHandler, false );
	document.addEventListener( "touchend", this.touchEndEventHandler, false );
}

// Similar to horizontalSlider but oriented vertically
function verticalSlider( sliderImageFileName, horizontalCenterPercent, topLimitPercent, sliderWidthPercent, trackWidthPercent, limitToLimitPercent, trackColor, bottomLimitValue, topLimitValue, startingValue, changeHandler ) {
	// make a persistent variable of this instance for later reference during event handling
	var inst = this;
	// make a variable allowing the label to become dormant
	this.dormant = true;
	// preserve the arguments
	this.sliderImageFileName = sliderImageFileName;
	this.trackColor = trackColor;
	this.bottomLimitValue = bottomLimitValue;
	this.topLimitValue = topLimitValue;
	this.currentValue = startingValue;
	this.sliderWidthPercent = sliderWidthPercent;
	this.trackWidthPercent = trackWidthPercent;
	this.topLimitPercent = topLimitPercent;
	this.horizontalCenterPercent = horizontalCenterPercent;
	this.limitToLimitPercent = limitToLimitPercent;
	// establish some other handy values
	this.homeValue = this.currentValue;
	this.valueRange = topLimitValue - bottomLimitValue;
	this.bottomLimitPixel = 0;
	this.topLimitPixel = 0;
	this.motionPixelRange = 0;
	this.nowTracking = false;
	// create the control's visible elements
	this.track = document.createElement( "div" );
	this.track.style.cssText = "position:absolute;background-color:" + this.trackColor;
	document.body.appendChild( this.track );
	this.slider = document.createElement( "div" );
	this.slider.style.cssText = "position:absolute";
	document.body.appendChild( this.slider );
	this.imageElement = new Image();
	this.imageElement.onload = function() { inst.windowResizeHandler(); };
	this.imageElement.src = sliderImageFileName;
	this.slider.appendChild( this.imageElement );

	// a routine to figure the geometry of this control
	this.resize = function( bottomLimitPercent, horizontalCenterPercent, limitToLimitPercent, sliderWidthPercent, trackWidthPercent ) {
		var windowWidth = window.innerWidth;
		var windowHeight = window.innerHeight;
		// calculate the control's pixel geometry according to the specified proportions
		var trackLeft = ( ( horizontalCenterPercent - ( trackWidthPercent / 2 ) ) * windowWidth ) | 0;
		var trackTop = ( ( topLimitPercent - ( trackWidthPercent / 2 ) ) * windowHeight ) | 0;
		var trackWidth = ( trackWidthPercent * windowWidth ) | 0;
		var trackHeight = ( ( limitToLimitPercent + trackWidthPercent ) * windowHeight ) | 0;
		// calculate the slider image's natural aspect ratio
		var imageAspectRatio = inst.imageElement.naturalWidth / inst.imageElement.naturalHeight;
		// calculate the pixel positions of the end points of the slider's motion
		inst.topLimitPixel = ( trackTop + ( trackWidth / 2 ) ) | 0;
		inst.bottomLimitPixel = (trackTop + trackHeight - ( trackWidth / 2 ) ) | 0;
		// calculate the slider range in terms of equivalent pixels
		inst.motionPixelRange = inst.bottomLimitPixel - inst.topLimitPixel;
		// calculate the proportional width of the slider image and the necessary height to retain the image's aspect ratio
		var sliderWidth = ( sliderWidthPercent * windowWidth ) | 0;
		var sliderHeight = ( sliderWidth / imageAspectRatio ) | 0;
		// calculate the pixel location of the slider image according to present value
		var sliderLeft = ( ( horizontalCenterPercent - ( sliderWidthPercent / 2 ) ) * windowWidth ) | 0;
		var sliderTop = ( inst.bottomLimitPixel - ( inst.motionPixelRange * ( inst.currentValue / ( inst.topLimitValue - inst.bottomLimitValue ) ) ) - ( sliderHeight / 2 ) ) | 0;
		// set the calculated geometry into the control's elements
		inst.track.style.left = "0" + trackLeft + "px";
		inst.track.style.top = "0" + trackTop + "px";
		inst.track.style.width = "0" + trackWidth + "px";
		inst.track.style.height = "0" + trackHeight + "px";
		inst.track.style.borderRadius = "0" + ( ( trackWidth / 2 ) | 0 ) + "px";
		inst.imageElement.style.left = inst.slider.style.left = "0" + sliderLeft + "px";
		inst.imageElement.style.top = inst.slider.style.top = "0" + sliderTop + "px";
		inst.imageElement.style.width = inst.slider.style.width = "0" + sliderWidth + "px";
		inst.imageElement.style.height = inst.slider.style.height = "0" + sliderHeight + "px";
	}
	// an event handler to call the resizing routine whenever there's a change in browser geometry
	this.windowResizeHandler = function() {
		if( inst.dormant ) return;
		inst.resize( inst.bottomLimitPercent, inst.horizontalCenterPercent, inst.limitToLimitPercent, inst.sliderWidthPercent, inst.trackWidthPercent );
	}

	// a routine to make the control visible and responsive
	this.activate = function() {
		inst.dormant = false;
		inst.track.style.display = "block";
		inst.slider.style.display = "block";
		inst.windowResizeHandler();
	}
	// a routine to make the control invisible and dormant
	this.deactivate = function() {
		inst.dormant = true;
		inst.track.style.display = "none";
		inst.slider.style.display = "none";
	}

	// a routine to programatically set the slider to a given position
	this.setSlider = function( givenValue ) {
		inst.currentValue = givenValue;
		inst.windowResizeHandler();
		changeHandler( inst.currentValue );
	}

	// a routine to convert click/touch screen geometry into the equivalent slider value
	this.updateControlValue = function( pixelY ) {
		if( pixelY > inst.bottomLimitPixel ) pixelY = inst.bottomLimitPixel;
		if( pixelY < inst.topLimitPixel ) pixelY = inst.topLimitPixel;
		inst.currentValue = inst.bottomLimitValue + inst.valueRange * ( inst.bottomLimitPixel - pixelY ) / inst.motionPixelRange;
		inst.windowResizeHandler();
		changeHandler( inst.currentValue );
	}

	// handlers for mouse and touch events
	this.sliderMouseDownEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		// a click on the slider "grabs" the slider...
		inst.nowTracking = true;
		// and sets the slider's vertical position to that of the point clicked
		inst.updateControlValue( e.clientY );
	}
	this.sliderMouseMoveEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		if( !inst.nowTracking ) return;
		// dragging the slider with the mouse varies the slider's vertical position
		inst.updateControlValue( e.clientY );
	}
	this.sliderMouseUpEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		// releasing the mouse button stops any further moving of the slider
		inst.nowTracking = false;
	}
	this.touchStartEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		// touching the slider "grabs" it...
		inst.nowTracking = true;
		// and sets the slider's vertical position to that of the point touched
		inst.updateControlValue( e.touches[ 0 ].clientY );
	}
	this.touchMoveEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		if( !inst.nowTracking ) return;
		// dragging the slider varies its vertical position
		inst.updateControlValue( e.touches[ 0 ].clientY );
	}
	this.touchEndEventHandler = function( e ) {
		if( inst.dormant ) return;
		e.preventDefault();
		// lifting the touch finger stops any further moving of the slider
		inst.nowTracking = false;
	}

	// at time of instantiation/creation, be dormant until activation is invoked
	this.deactivate();

	// add event listeners to invoke the resize handler
	window.addEventListener( "resize", this.windowResizeHandler, false );
	window.addEventListener( "orientationchange", this.windowResizeHandler, false );
	// add event listeners to invoke the mouse/touch handlers
	this.track.addEventListener( "mousedown", this.sliderMouseDownEventHandler, false );
	this.slider.addEventListener( "mousedown", this.sliderMouseDownEventHandler, false );
	this.track.addEventListener( "mousemove", this.sliderMouseMoveEventHandler, false );
	this.slider.addEventListener( "mousemove", this.sliderMouseMoveEventHandler, false );
	window.addEventListener( "mouseup", this.sliderMouseUpEventHandler, false );
	this.track.addEventListener( "touchstart", this.touchStartEventHandler, false );
	this.slider.addEventListener( "touchstart", this.touchStartEventHandler, false );
	this.track.addEventListener( "touchmove", this.touchMoveEventHandler, false );
	this.slider.addEventListener( "touchmove", this.touchMoveEventHandler, false );
	document.addEventListener( "touchend", this.touchEndEventHandler, false );
}

// imageButton places the image from an image file into a named HTML element.
// The image can be clicked/touched to invoke an event handler routine.
// The "preserveAspect" argument can be supplied as "W", "H" or anything else and indicates that during resizing, the image's
//  original aspect ratio is to be preserved with size tracking:
//   - the width of the browser window ("W")
//   - the height of the browser window ("H")
//   - neither of the above and simply stretch along with any resizing
// Internal variable "buttonDown" can be polled to see if the button is presently being held down
// Internal variables "touchPointX" and "touchPointY" can be polled to see where the touch is currently hitting the button ( 0.0 = left/top, 100.0 = right/bottom)
function imageButton( imageFileName, leftPercent, topPercent, widthPercent, heightPercent, preserveAspect, allowSlidingOn, clickHandler ) {
	// make a persistent variable of this instance for later reference during event handling
	var inst = this;
	// make a variable allowing the label to become dormant
	this.dormant = true;
	// preserve the arguments
	this.imageFileName = imageFileName;
	this.leftPercent = leftPercent;
	this.topPercent = topPercent;
	this.widthPercent = widthPercent;
	this.heightPercent = heightPercent;
	this.leftPixel = 0;
	this.topPixel = 0;
	this.widthPixel = 0;
	this.heightPixel = 0;
	this.preserveAspect = preserveAspect;
	this.visible = document.createElement( "div" );
	this.visible.style.cssText = "position:absolute";
	document.body.appendChild( this.visible );
	this.imageElement = new Image();
	this.imageElement.onload = function() { inst.windowResizeHandler(); };
	this.imageElement.src = imageFileName;
	this.visible.appendChild( this.imageElement );
	this.buttonDown = false;
	this.touchPointX = 0;
	this.touchPointY = 0;
	this.resize = function( leftPercent, topPercent, widthPercent, heightPercent ) {
		var windowWidth = window.innerWidth;
		var windowHeight = window.innerHeight;
		// calculate the button image's natural aspect ratio
		var imageAspectRatio = inst.imageElement.naturalWidth / inst.imageElement.naturalHeight;
		// set the button's location geometry
		inst.leftPixel = ( ( leftPercent * windowWidth ) | 0 );
		inst.topPixel = ( ( topPercent * windowHeight ) | 0 );
		inst.imageElement.style.left = inst.visible.style.left = "0" + inst.leftPixel + "px";
		inst.imageElement.style.top = inst.visible.style.top = "0" + inst.topPixel + "px";
		// calculate the button's size geometry
		var rulingWidth = widthPercent * windowWidth;
		var rulingHeight = heightPercent * windowHeight;
		// set the button's size geometry
		switch( inst.preserveAspect ) {
			case "W":
				// set the button's size according to the width of the browser window and maintain the image's original aspect ratio
				inst.widthPixel = ( ( rulingWidth ) | 0 );
				inst.heightPixel = ( ( rulingWidth / imageAspectRatio ) | 0 );
				break;
			case "H":
				// set the button's size according to the height of the browser window and maintain the image's original aspect ratio
				inst.widthPixel = ( ( rulingHeight * imageAspectRatio ) | 0 );
				inst.heightPixel = ( ( rulingHeight ) | 0 );
				break;
			default:
				// set the button's size according to the geometry of the browser window and ignore the original image's aspect ratio
				inst.widthPixel = ( ( rulingWidth ) | 0 );
				inst.heightPixel = ( ( rulingHeight ) | 0 );
				break;
		}
		inst.imageElement.style.width = inst.visible.style.width = "0" + inst.widthPixel + "px";
		inst.imageElement.style.height = inst.visible.style.height = "0" + inst.heightPixel + "px";
	}
	// an event handler to call the resizing routine whenever there's a change in browser geometry
	this.windowResizeHandler = function() {
		if( inst.dormant ) return;
		inst.resize( inst.leftPercent, inst.topPercent, inst.widthPercent, inst.heightPercent );
	}

	// a routine to make the button visible and responsive
	this.activate = function() {
		inst.dormant = false;
		inst.visible.style.display = "block";
		inst.visible.style.zIndex = "10";
		inst.windowResizeHandler();
	}

	// a routine to make the button invisible and dormant
	this.deactivate = function() {
		inst.dormant = true;
		inst.visible.style.display = "none";
		inst.visible.style.zIndex = "0";
	}
	// convert touchpoint screen coordinates into button-relative horizontal position
	this.horizontalTouchPoint = function( touchScreenX ) {
		var leftBorderPixel = inst.leftPixel;
		var rightBorderPixel = inst.leftPixel + inst.widthPixel;
		var touchX = touchScreenX;
		if( touchX > rightBorderPixel ) touchX = rightBorderPixel;
		if( touchX < leftBorderPixel ) touchX = leftBorderPixel;
		return ( ( touchX - leftBorderPixel ) / ( rightBorderPixel - leftBorderPixel ) );
	}
	// convert touchpoint screen coordinates into button-relative vertical position
	this.verticalTouchPoint = function( touchScreenY ) {
		var topBorderPixel = inst.topPixel;
		var bottomBorderPixel = inst.topPixel + inst.heightPixel;
		var touchY = touchScreenY;
		if( touchY > bottomBorderPixel ) touchY = bottomBorderPixel;
		if( touchY < topBorderPixel ) touchY = topBorderPixel;
		return ( ( touchY - topBorderPixel ) / ( bottomBorderPixel - topBorderPixel ) );
	}
	// handlers for mouse and touch events
	this.mouseDownEventHandler = function( e ) {
		if( inst.dormant ) return;
		event.preventDefault();
		// a mouse click on the button sets the button's "Down" flag to true...
		inst.buttonDown = true;
		// initializes the touch location variables...
		inst.touchPointX = 100.0 * inst.horizontalTouchPoint( e.clientX );
		inst.touchPointY = 100.0 * inst.verticalTouchPoint( e.clientY );
		// and invokes the button's handler routine
		clickHandler( e );
	}
	this.mouseMoveEventHandler = function( e ) {
		if( inst.dormant ) return;
		if( !inst.buttonDown ) return;
		event.preventDefault();
		// update the touch location variables
		inst.touchPointX = 100.0 * inst.horizontalTouchPoint( e.clientX );
		inst.touchPointY = 100.0 * inst.verticalTouchPoint( e.clientY );
	}
	this.mouseUpEventHandler = function( e ) {
		if( inst.dormant ) return;
		// the mouse button being released resets the button's "Down" flag to false
		inst.buttonDown = false;
	}
	this.mouseOutEventHandler = function( e ) {
		if( inst.dormant ) return;
		// dragging the mouse pointer outside the button's extent also resets the button's "Down" flag to false
		inst.buttonDown = false;
	}
	this.touchStartEventHandler = function( e ) {
		if( inst.dormant ) return;
		event.preventDefault();
		// touching the button sets the button's "Down" flag to true...
		inst.buttonDown = true;
		// initializes the touch location variables...
		inst.touchPointX = 100.0 * inst.horizontalTouchPoint( e.touches[ 0 ].clientX );
		inst.touchPointY = 100.0 * inst.verticalTouchPoint( e.touches[ 0 ].clientY );
		// and invokes the button's handler routine
		clickHandler( e );
	}
	this.touchMoveEventHandler = function( e ) {
		if( inst.dormant ) return;
		if( !inst.buttonDown ) {
			if( allowSlidingOn )
				inst.buttonDown = true;
			else
				return;
		}
		event.preventDefault();
		// update the touch location variables
		inst.touchPointX = 100.0 * inst.horizontalTouchPoint( e.touches[ 0 ].clientX );
		inst.touchPointY = 100.0 * inst.verticalTouchPoint( e.touches[ 0 ].clientY );
	}
	this.touchEndEventHandler = function( e ) {
		if( inst.dormant ) return;
		event.preventDefault();
		// lifting the touching finger resets the button's "Down" flag to false
		inst.buttonDown = false;
	}
	this.touchLeaveEventHandler = function( e ) {
		if( inst.dormant ) return;
		event.preventDefault();
		// dragging the touching finger outside the button's extent also reset the button's "Down" flag to false
		inst.buttonDown = false;
	}

	// at time of instantiation/creation, be dormant until activation is invoked
	this.deactivate();

	// add event listeners to invoke the resize handler
	window.addEventListener( "resize", this.windowResizeHandler, false );
	window.addEventListener( "orientationchange", this.windowResizeHandler, false );
	// add event listeners to invoke the mouse/touch handlers
	this.visible.addEventListener( "mousedown", this.mouseDownEventHandler, false );
	this.visible.addEventListener( "mousemove", this.mouseMoveEventHandler, false );
	this.visible.addEventListener( "mouseup", this.mouseUpEventHandler, false );
	this.visible.addEventListener( "mouseout", this.mouseUpEventHandler, false );
	this.visible.addEventListener( "touchstart", this.touchStartEventHandler, false );
	this.visible.addEventListener( "touchmove", this.touchMoveEventHandler, false );
	this.visible.addEventListener( "touchend", this.touchEndEventHandler, false );
	this.visible.addEventListener( "touchleave", this.touchLeaveEventHandler, false );
}

