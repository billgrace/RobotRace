// rrTrack.js - track generation routines

// A track layout is composed of
//	1) a collection of characteristics that apply over the entire track
//	2) an origin point and starting horizontal direction ( x, z in THREE.js )
//	3) any number of track sections each of which is
//		a) straight with given length and elevation change
//		b) curve to the right with given radius, angular extent and elevation change
//		c) curve to the left with given radius, angular extent and elevation change
//	4) a path-closing section ( a small set of straight and curve sections ) to make the course continuous
// !!!! Maybe we'll include (4) and maybe we won't......
// Thus, the global variable "rrTrackLayout" is an array of objects where the first
//	object is the origin, the last objects ares the closing sections ( as needed)
//	and any collection of straight and curve sections between.
// The points, curves and straight sections along with the elevations define a linear
//	path which is taken to be the center of the surface of the race track. The race
//	track extends to the left and right of this central path as determined by the
//	track width and the track has a thickness that extends downward from this path line.
//
// Lengths may be specified by the user in either inches or millimeters and the inches
//	are converted into millimeters for internal computations.
// Angles are specified by the user in degrees and these are converted into radians
//	for internal computations.

var rrTrackLayout = [];
//----- The first object in the rrTrackLayout array contains the global characteristics of the track
// var trackCharacteristics = new Object();
// trackCharacteristics.sectionType = "characteristics";
// trackCharacteristics.trackWidth = 0;
// trackCharacteristics.trackThickness = 0;
// trackCharacteristics.color = "0x00ffff";

//----- The second object in the rrTrackLayout array contains the starting location, direction and elevation of the track
// var trackPathOrigin = new Object();
// trackPathOrigin.sectionType = "origin";
// trackPathOrigin.location = new THREE.Vector3();
// trackPathOrigin.direction = new THREE.Vector3();

//----- The ensuing objects in the rrTrackLayout array contain individual track segments
// var trackPathStraightSection = new Object();
// trackPathStraightSection.sectionType = "straight";
// trackPathStraightSection.length = 0;
// trackPathStraightSection.rise = 0;

// var trackPathCurveRightSection = new Object();
// trackPathCurveRightSection.sectionType = "curveRight";
// trackPathCurveRightSection.radius = 0;
// trackPathCurveRightSection.degreeAngle = 0;
// trackPathCurveRightSection.rise = 0;

// var trackPathCurveLeftSection = new Object();
// trackPathCurveLeftSection.sectionType = "curveLeft";
// trackPathCurveLeftSection.radius = 0;
// trackPathCurveLeftSection.degreeAngle = 0;
// trackPathCurveLeftSection.rise = 0;

// Each track section object also has (initially only placeholders) indexes for the small piece
//	array which track where each section begins and ends in that larger array.

// The first step in processing rrTrackLayout is to sub-divide it into many small pieces. This serves
//	both to improve rendering of the curves and to establish many locations along the track path that
//	can be used to animate by "dragging" things along the track.
// The target size for piece length is a configurable number of millimeters. For straight sections this
//	is straight forward and the last piece will be more than zero length and up to full configured piece length.
// Because the length of each small piece is configurable (in the hopes that this will allow good trade-offs
//	between track quality/resolution and processor speed/performance) the number of degrees to step the
//	slope of each piece is also configurable.
// For curves, the internal computations are given a radius in millimeters and an angular extent for
//	each piece so the angular extents are calculated to give a linear length of each curve piece equal
//	to the same number of millimeters as in a straight section - again with a fractional last piece as needed.
// Starting with radius = R millimeters and total angular extent = A radians, we have:
//	Total arclength = R x A which re-shuffles as:
//		A = total arclength / R so for one full piece of curved track:
//		angle (in radians) to make one full piece of curve arclength = configured piece length (in millimeters) / R
//	... so the angular extent of each piece of a curve section is the piece length divided by the radius.
// This entire processing stage completely ignores elevations ( y component ) and deals only with the
//	horizontal geometry of the track. Three dimensional vectors are used but the y components (vertical)
//	are all left at the same value (the origin point's elevation).
// Each small piece generated is either straight, curving right or curving left. Each small piece
//	has a pieceType ("straight", "curveRight", "curveLeft"), pieceStartPoint and pieceFinishPoints (Vector3),
//	pieceStartDirection and pieceFinishDirections (Vector3), plus pieceLength (for straight pieces)
//	and radius and angular extent (for curve pieces).
// To avoid needless repetition of a lot of vector arithmetic, all the vertices of each piece are also
//	generated during this step with the elevation components ignored. This generates a "complete" track
//	lacking only rise and fall so the horizontal shape is fully calculated. The appropriate elevations
//	at each vertex are calculated in the next step and substituted in to complete the track geometry.
// Each straight small piece has eight vertices representing the corners of a rectangular block. Each
//	curved small piece has ten vertices representing the corners of a trapezoidal block PLUS vertices
//	at the midpoint of the longer circumferential side so the surfaces can be reduced to triangular faces
//	for rendering.
// The vertices are given names during calculation ("start"/"finish", "left"/"right", "top"/"bottom" and
//	"midpoint" for the sake of conceptual sanity but they're reduced to integer indexes when it's time to
//	make the arrays of vertices and faces that become rendering meshes and physics bodies.
// During this step we also place a point ("center") that gives the center of the piece's volume which
//	will be used as the position for the piece's rendering mesh and physics body.
// The collection of track pieces generated in this first step is pushed onto a global variable array
//	"rrTrackPieces".
var rrTrackPieces = [];

// The second step in processing rrTrackLayout is to generate an elevation for each piece's pathStartPoint such
//	that the user's given rise and run for each section is honored AND the transitions between sections are
//	reasonably smooth.
// Each pair of sections is treated - including the pair of last/first at the track path origin.
// The criterion used is that there be no more than one degree of slope change between any two small pieces
//	of track.
// The slope for the point where two track sections meet is set to the average of the slopes of the two sections.
// Then each section is taken and run through an iterative process where the slope of the outermost small piece on
//	each end of the section is compared to the slope of the line connecting those two extremes. If the difference
//	is no more than one degree, the process is done. Otherwise, the extreme small piece is assigned a slope one
//	degree closer to that of the connecting line and the process is repeated using the next-inner small piece(s).
// This process gives a reasonably smooth slope transition and results in every small piece path start point
//	being assigned an elevation.
var rrTrackSectionStartPointElevations = [];

// The third step is to traverse the entire track small piece by small piece and generate a THREE.js mesh and
//	a CANNON.js body for each small piece. These meshes and bodies are added to the scene and world and also
//	to lists of track meshes and track bodies so the track can later be removed and regenerated as the
//	process of designing a track layout continues.
var rrTrackPieceMeshList = [];
var rrTrackPieceBodyList = [];

// Ultimately, a finished track layout is stored into a server database as the entire rrTrackLayout array and
//	a track select page will allow editing and selection of track layouts in the database.
// For now... make a few and push them onto an array so they can be swapped in and out.
var rrTrackList = [];

var trackBodyMaterial;

// Get a complete track layout from the user
function getTrackLayouts() {
	rrTrackList.length = 0;
	makeTrack0();
	makeTrack1();
	makeTrack2();
	makeTrack3();
};
function selectTrackLayout( layoutIndex ) {
	layoutIndex = Math.max( layoutIndex, 0 );
	layoutIndex = Math.min( layoutIndex, rrTrackList.length );
	rrTrackLayout.length = 0;
	var sectionCount = rrTrackList[ layoutIndex ].length;
	for( currentSection = 0; currentSection < sectionCount; currentSection++ ) {
		var sectionObject = new Object();
		var sectionObject = rrTrackList[ layoutIndex ][ currentSection ];
		rrTrackLayout.push( sectionObject );
	}
	installHorizon();
	removeExistingTrackMeshesAndBodies();
	figureTrackPieces();
	figureTrackElevations();
	copyPathElevationsToVertices();
	figureTrackPieceCenters();
	makeTrackMeshesAndBodies();
}
function makeTrack0() {
	// a simple, flat oval track
	var rrTrackLayout0 = [];

	var trackCharacteristics = new Object();
	trackCharacteristics.sectionType = "characteristics";
	trackCharacteristics.trackWidth = 20;
	trackCharacteristics.trackThickness = 5;
	trackCharacteristics.targetTrackPieceLength = 10;
	trackCharacteristics.pieceSlopeIncrementDegreeAngle = 5;
	trackCharacteristics.color = 0x905020;
	trackCharacteristics.horizonDistance = 500;
	trackCharacteristics.visibleTrackPathPointRadius = 5;
	trackCharacteristics.westImageFileName = 'homeWestMirrored.jpg';
	trackCharacteristics.eastImageFileName = 'homeEastMirrored.jpg';
	trackCharacteristics.skyImageFileName = '!8888ff';
	trackCharacteristics.groundImageFileName = '!ffcc22';
	trackCharacteristics.northImageFileName = 'homeNorthMirrored.jpg';
	trackCharacteristics.southImageFileName = 'homeSouthMirrored.jpg';
	rrTrackLayout0.push( trackCharacteristics );

	var trackPathOrigin = new Object();
	trackPathOrigin.sectionType = "origin";
	trackPathOrigin.location = new THREE.Vector3( -150, trackCharacteristics.trackThickness, 50 );
	trackPathOrigin.direction = new THREE.Vector3( 1, 0, 0 );
	rrTrackLayout0.push( trackPathOrigin );

	var trackPathStraightSection1 = new Object();
	trackPathStraightSection1.sectionType = "straight";
	trackPathStraightSection1.length = 300;
	trackPathStraightSection1.rise = 0;
	rrTrackLayout0.push( trackPathStraightSection1 );

	var trackPathCurveLeftSection1 = new Object();
	trackPathCurveLeftSection1.sectionType = "curveLeft";
	trackPathCurveLeftSection1.radius = 50;
	trackPathCurveLeftSection1.degreeAngle = 180;
	trackPathCurveLeftSection1.rise = 0;
	rrTrackLayout0.push( trackPathCurveLeftSection1 );

	var trackPathStraightSection2 = new Object();
	trackPathStraightSection2.sectionType = "straight";
	trackPathStraightSection2.length = 300;
	trackPathStraightSection2.rise = 0;
	rrTrackLayout0.push( trackPathStraightSection2 );

	var trackPathCurveLeftSection2 = new Object();
	trackPathCurveLeftSection2.sectionType = "curveLeft";
	trackPathCurveLeftSection2.radius = 50;
	trackPathCurveLeftSection2.degreeAngle = 180;
	trackPathCurveLeftSection2.rise = 0;
	rrTrackLayout0.push( trackPathCurveLeftSection2 );

	rrTrackList.push( rrTrackLayout0 );
};
function makeTrack1() {
	// a simple oval track with some slopes
	var rrTrackLayout1 = [];

	var trackCharacteristics = new Object();
	trackCharacteristics.sectionType = "characteristics";
	trackCharacteristics.trackWidth = 20;
	trackCharacteristics.trackThickness = 5;
	trackCharacteristics.targetTrackPieceLength = 10;
	trackCharacteristics.pieceSlopeIncrementDegreeAngle = 5;
	trackCharacteristics.color = 0x905020;
	trackCharacteristics.horizonDistance = 500;
	trackCharacteristics.visibleTrackPathPointRadius = 5;
	trackCharacteristics.westImageFileName = 'homeWestMirrored.jpg';
	trackCharacteristics.eastImageFileName = 'homeEastMirrored.jpg';
	trackCharacteristics.skyImageFileName = '!8888ff';
	trackCharacteristics.groundImageFileName = 'concrete.jpg';
	trackCharacteristics.northImageFileName = 'homeNorthMirrored.jpg';
	trackCharacteristics.southImageFileName = 'homeSouthMirrored.jpg';
	rrTrackLayout1.push( trackCharacteristics );
	var trackPathOrigin = new Object();
	trackPathOrigin.sectionType = "origin";
	trackPathOrigin.location = new THREE.Vector3( -150, trackCharacteristics.trackThickness, 50 );
	trackPathOrigin.direction = new THREE.Vector3( 1, 0, 0 );
	rrTrackLayout1.push( trackPathOrigin );

	var trackPathStraightSection1 = new Object();
	trackPathStraightSection1.sectionType = "straight";
	trackPathStraightSection1.length = 300;
	trackPathStraightSection1.rise = 20;
	rrTrackLayout1.push( trackPathStraightSection1 );

	var trackPathCurveLeftSection1 = new Object();
	trackPathCurveLeftSection1.sectionType = "curveLeft";
	trackPathCurveLeftSection1.radius = 50;
	trackPathCurveLeftSection1.degreeAngle = 180;
	trackPathCurveLeftSection1.rise = 0;
	rrTrackLayout1.push( trackPathCurveLeftSection1 );

	var trackPathStraightSection2 = new Object();
	trackPathStraightSection2.sectionType = "straight";
	trackPathStraightSection2.length = 300;
	trackPathStraightSection2.rise = -20;
	rrTrackLayout1.push( trackPathStraightSection2 );

	var trackPathCurveLeftSection2 = new Object();
	trackPathCurveLeftSection2.sectionType = "curveLeft";
	trackPathCurveLeftSection2.radius = 50;
	trackPathCurveLeftSection2.degreeAngle = 180;
	trackPathCurveLeftSection2.rise = 0;
	rrTrackLayout1.push( trackPathCurveLeftSection2 );

	rrTrackList.push( rrTrackLayout1 );
};
function makeTrack2() {
	// an oval track with slopes and a 540 degree turn
	var rrTrackLayout2 = [];

	var trackCharacteristics = new Object();
	trackCharacteristics.sectionType = "characteristics";
	trackCharacteristics.trackWidth = 20;
	trackCharacteristics.trackThickness = 5;
	trackCharacteristics.targetTrackPieceLength = 10;
	trackCharacteristics.pieceSlopeIncrementDegreeAngle = 5;
	trackCharacteristics.color = 0x905020;
	trackCharacteristics.horizonDistance = 1500;
	trackCharacteristics.visibleTrackPathPointRadius = 5;
	trackCharacteristics.westImageFileName = 'homeWestMirrored.jpg';
	trackCharacteristics.eastImageFileName = 'homeEastMirrored.jpg';
	trackCharacteristics.skyImageFileName = '!8888ff';
	trackCharacteristics.groundImageFileName = 'concrete.jpg';
	trackCharacteristics.northImageFileName = 'homeNorthMirrored.jpg';
	trackCharacteristics.southImageFileName = 'homeSouthMirrored.jpg';
	rrTrackLayout2.push( trackCharacteristics );

	var trackPathOrigin = new Object();
	trackPathOrigin.sectionType = "origin";
	trackPathOrigin.location = new THREE.Vector3( -150, trackCharacteristics.trackThickness, 50 );
	trackPathOrigin.direction = new THREE.Vector3( 1, 0, 0 );
	rrTrackLayout2.push( trackPathOrigin );

	var trackPathStraightSection1 = new Object();
	trackPathStraightSection1.sectionType = "straight";
	trackPathStraightSection1.length = 300;
	trackPathStraightSection1.rise = 10;
	rrTrackLayout2.push( trackPathStraightSection1 );

	var trackPathCurveLeftSection1 = new Object();
	trackPathCurveLeftSection1.sectionType = "curveLeft";
	trackPathCurveLeftSection1.radius = 50;
	trackPathCurveLeftSection1.degreeAngle = 540;
	trackPathCurveLeftSection1.rise = 50;
	rrTrackLayout2.push( trackPathCurveLeftSection1 );

	var trackPathStraightSection2 = new Object();
	trackPathStraightSection2.sectionType = "straight";
	trackPathStraightSection2.length = 300;
	trackPathStraightSection2.rise = -25;
	rrTrackLayout2.push( trackPathStraightSection2 );

	var trackPathCurveLeftSection2 = new Object();
	trackPathCurveLeftSection2.sectionType = "curveLeft";
	trackPathCurveLeftSection2.radius = 50;
	trackPathCurveLeftSection2.degreeAngle = 180;
	trackPathCurveLeftSection2.rise = -35;
	rrTrackLayout2.push( trackPathCurveLeftSection2 );

	rrTrackList.push( rrTrackLayout2 );
};
function makeTrack3() {
	// an oval track with slopes and a 540 degree turn
	var rrTrackLayout3 = [];

	var trackCharacteristics = new Object();
	trackCharacteristics.sectionType = "characteristics";
	trackCharacteristics.trackWidth = 20;
	trackCharacteristics.trackThickness = 5;
	trackCharacteristics.targetTrackPieceLength = 10;
	trackCharacteristics.pieceSlopeIncrementDegreeAngle = 5;
	trackCharacteristics.color = 0x905020;
	trackCharacteristics.horizonDistance = 1500;
	trackCharacteristics.visibleTrackPathPointRadius = 5;
	trackCharacteristics.westImageFileName = 'homeWestMirrored.jpg';
	trackCharacteristics.eastImageFileName = 'homeEastMirrored.jpg';
	trackCharacteristics.skyImageFileName = '!8888ff';
	trackCharacteristics.groundImageFileName = 'concrete.jpg';
	trackCharacteristics.northImageFileName = 'homeNorthMirrored.jpg';
	trackCharacteristics.southImageFileName = 'homeSouthMirrored.jpg';
	rrTrackLayout3.push( trackCharacteristics );

	var trackPathOrigin = new Object();
	trackPathOrigin.sectionType = "origin";
	trackPathOrigin.location = new THREE.Vector3( -300, trackCharacteristics.trackThickness, 50 );
	trackPathOrigin.direction = new THREE.Vector3( 1, 0, 0 );
	rrTrackLayout3.push( trackPathOrigin );

	var trackPathStraightSection1 = new Object();
	trackPathStraightSection1.sectionType = "straight";
	trackPathStraightSection1.length = 300;
	trackPathStraightSection1.rise = 0;
	rrTrackLayout3.push( trackPathStraightSection1 );

	var trackPathCurveLeftSection1 = new Object();
	trackPathCurveLeftSection1.sectionType = "curveLeft";
	trackPathCurveLeftSection1.radius = 50;
	trackPathCurveLeftSection1.degreeAngle = 135;
	trackPathCurveLeftSection1.rise = 10;
	rrTrackLayout3.push( trackPathCurveLeftSection1 );

	var trackPathCurveRightSection1 = new Object();
	trackPathCurveRightSection1.sectionType = "curveRight";
	trackPathCurveRightSection1.radius = 50;
	trackPathCurveRightSection1.degreeAngle = 540;
	trackPathCurveRightSection1.rise = 50;
	rrTrackLayout3.push( trackPathCurveRightSection1 );

	var trackPathStraightSection2 = new Object();
	trackPathStraightSection2.sectionType = "straight";
	// trackPathStraightSection2.length = ( 200 / Math.sqrt( 2 ) );
	trackPathStraightSection2.length = 200;
	trackPathStraightSection2.rise = 0;
	rrTrackLayout3.push( trackPathStraightSection2 );

	var trackPathCurveLeftSection2 = new Object();
	trackPathCurveLeftSection2.sectionType = "curveLeft";
	trackPathCurveLeftSection2.radius = 50;
	trackPathCurveLeftSection2.degreeAngle = 135;
	trackPathCurveLeftSection2.rise = -10;
	rrTrackLayout3.push( trackPathCurveLeftSection2 );

	var trackPathStraightSection3 = new Object();
	trackPathStraightSection3.sectionType = "straight";
	trackPathStraightSection3.length = 200;
	trackPathStraightSection3.rise = 0;
	rrTrackLayout3.push( trackPathStraightSection3 );

	var trackPathCurveLeftSection3 = new Object();
	trackPathCurveLeftSection3.sectionType = "curveLeft";
	trackPathCurveLeftSection3.radius = 50;
	trackPathCurveLeftSection3.degreeAngle = 90;
	trackPathCurveLeftSection3.rise = 0;
	rrTrackLayout3.push( trackPathCurveLeftSection3 );

	var trackPathStraightSection4 = new Object();
	trackPathStraightSection4.sectionType = "straight";
	trackPathStraightSection4.length = ( 300 + ( 400 / Math.sqrt( 2 ) ) );
	trackPathStraightSection4.rise = -50;
	rrTrackLayout3.push( trackPathStraightSection4 );

	var trackPathCurveLeftSection4 = new Object();
	trackPathCurveLeftSection4.sectionType = "curveLeft";
	trackPathCurveLeftSection4.radius = 50;
	trackPathCurveLeftSection4.degreeAngle = 90;
	trackPathCurveLeftSection4.rise = 0;
	rrTrackLayout3.push( trackPathCurveLeftSection4 );

	var trackPathStraightSection5 = new Object();
	trackPathStraightSection5.sectionType = "straight";
	trackPathStraightSection5.length = 200;
	trackPathStraightSection5.rise = 0;
	rrTrackLayout3.push( trackPathStraightSection5 );

	var trackPathCurveLeftSection5 = new Object();
	trackPathCurveLeftSection5.sectionType = "curveLeft";
	trackPathCurveLeftSection5.radius = 50;
	trackPathCurveLeftSection5.degreeAngle = 90;
	trackPathCurveLeftSection5.rise = 0;
	rrTrackLayout3.push( trackPathCurveLeftSection5 );
	rrTrackList.push( rrTrackLayout3 );
};

// Remove any existing track meshes and bodies and empty all the track list arrays (except the track layout section description list)
function removeExistingTrackMeshesAndBodies() {
	if( rrTrackPieceMeshList.length > 0 ) {
		for( var i = 0; i < rrTrackPieceMeshList.length; i++ ) {
			scene.remove( rrTrackPieceMeshList[ i ] );
		}
		rrTrackPieceMeshList.length = 0;
	}
	if( rrTrackPieceBodyList.length > 0 ) {
		for( var i = 0; i < rrTrackPieceBodyList.length; i++ ) {
			world.remove( rrTrackPieceBodyList[ i ] );
		}
		rrTrackPieceBodyList.length = 0;
	}
};

// Traverse a track layout list of sections and create the lists of small track pieces which will be rendered
function figureTrackPieces() {
	rrTrackPieces.length = 0;	// start with an empty array in which to store the track pieces to be generated
	var trackWidth = rrTrackLayout[ 0 ].trackWidth;
	// ( at this stage, we ignore Y components which will be added when the track piece elevations are figured out later
	// var trackThickness = rrTrackLayout[ 0 ].trackThickness;
	// // The separation of vertices from "top" to "bottom" is the track thickness in the -Y direction
	// var downVector = new THREE.Vector3( 0, -1, 0 );
	// downVector.multiplyScalar( trackThickness );
	var previousPiecePathFinishPoint = new THREE.Vector3();
	var previousPiecePathFinishDirection = new THREE.Vector3();
	var yAxisDirection = new THREE.Vector3( 0, 1, 0 );
	// Start with the track path origin point and direction acting as the "finish" items of the "previous section"
	previousPiecePathFinishPoint.copy( rrTrackLayout[ 1 ].location );
	previousPiecePathFinishDirection.copy( rrTrackLayout[ 1 ].direction );
	// starting past the characteristics and origin entries, traverse the layout array and process each section
	for( sectionIndex = 2; sectionIndex < rrTrackLayout.length; sectionIndex++ ) {
		// Record the piece index where this section begins
		rrTrackLayout[ sectionIndex ].beginPieceIndex = rrTrackPieces.length;
		switch( rrTrackLayout[ sectionIndex ].sectionType ) {
			case "straight":
				// Full pieces are the configured number of millimeters in length
				var fullPieceCount = Math.floor( rrTrackLayout[ sectionIndex ].length / rrTrackLayout[ 0 ].targetTrackPieceLength );
				// Last piece is whatever it takes to make up the actual given length
				var lastPieceLength = rrTrackLayout[ sectionIndex ].length - ( fullPieceCount * rrTrackLayout[ 0 ].targetTrackPieceLength );
				// Traverse the straight section making each small piece
				//  ( if the length of the odd-sized last piece is too close to zero, ignore that piece )
				for( var currentPiece = 0; currentPiece < ( fullPieceCount + 1 ); currentPiece++ ) {
					var currentPieceLength;
					if( currentPiece == fullPieceCount ) {
						// This is the odd-sized last piece...
						currentPieceLength = lastPieceLength;
					} else {
						// This is just another full size piece
						currentPieceLength = rrTrackLayout[ 0 ].targetTrackPieceLength;
					}
					// Screen out overly small last pieces
					if( currentPieceLength > 0.001 ) {
						// Make the object representing the current piece of straight track section
						var thisPiece = new Object();
						thisPiece.pieceType = "straight";
						thisPiece.pieceLength = currentPieceLength;
						// The path start point and direction are those of the previous piece's end point
						thisPiece.piecePathStartPoint = new THREE.Vector3();
						thisPiece.piecePathStartPoint.copy( previousPiecePathFinishPoint );
						thisPiece.piecePathStartDirection = new THREE.Vector3();
						thisPiece.piecePathStartDirection.copy( previousPiecePathFinishDirection );
						// The path finish point for a full straight piece is one millimeter from the start point in the direction of the piece
						thisPiece.piecePathFinishPoint = new THREE.Vector3();
						thisPiece.piecePathSpan = new THREE.Vector3();
						thisPiece.piecePathSpan.copy( previousPiecePathFinishDirection );	// get the direction of this piece
						thisPiece.piecePathSpan.normalize();
						thisPiece.piecePathSpan.multiplyScalar( currentPieceLength );
						thisPiece.piecePathFinishPoint.addVectors( thisPiece.piecePathStartPoint, thisPiece.piecePathSpan );	// add it to the start point
						thisPiece.piecePathFinishDirection = new THREE.Vector3();
						thisPiece.piecePathFinishDirection.copy( thisPiece.piecePathStartDirection );	// for straight pieces, the direction never changes
						// Make the eight vertices of this small piece of straight track
						thisPiece.startRightTopVertex = new THREE.Vector3();
						thisPiece.finishRightTopVertex = new THREE.Vector3();
						thisPiece.finishLeftTopVertex = new THREE.Vector3();
						thisPiece.startLeftTopVertex = new THREE.Vector3();
						thisPiece.startRightBottomVertex = new THREE.Vector3();
						thisPiece.finishRightBottomVertex = new THREE.Vector3();
						thisPiece.finishLeftBottomVertex = new THREE.Vector3();
						thisPiece.startLeftBottomVertex = new THREE.Vector3();
						// forwardVector.subVectors( thisPiece.piecePathStartPoint - thisPiece.piecePathFinishPoint );
						// The separation of vertices "left" and "right" is taken one at a time from the center-located path points
						// ... the direction of these is the piece direction rotated 90 degrees either way about the Y axis and
						// ... the length of each is half the track width.
						var leftwardVector = new THREE.Vector3();
						var rightwardVector = new THREE.Vector3();
						leftwardVector.copy( thisPiece.piecePathStartDirection );
						rightwardVector.copy( thisPiece.piecePathStartDirection );
						leftwardVector.normalize();
						rightwardVector.normalize();
						leftwardVector.multiplyScalar( rrTrackLayout[ 0 ].trackWidth / 2 );
						rightwardVector.multiplyScalar( rrTrackLayout[ 0 ].trackWidth / 2 );
						leftwardVector.applyAxisAngle( yAxisDirection, Math.PI / 2 );
						rightwardVector.applyAxisAngle( yAxisDirection, -Math.PI / 2 );
						// Now place the piece vertices
						thisPiece.startRightTopVertex.addVectors( thisPiece.piecePathStartPoint, rightwardVector );
						thisPiece.finishRightTopVertex.addVectors( thisPiece.piecePathFinishPoint, rightwardVector );
						thisPiece.finishLeftTopVertex.addVectors( thisPiece.piecePathFinishPoint, leftwardVector );
						thisPiece.startLeftTopVertex.addVectors( thisPiece.piecePathStartPoint, leftwardVector );
						// ( just copy the top vectors to the bottom vectors and ignore the vertical quantities for now...)
						thisPiece.startRightBottomVertex.copy( thisPiece.startRightTopVertex );
						thisPiece.finishRightBottomVertex.copy( thisPiece.finishRightTopVertex );
						thisPiece.finishLeftBottomVertex.copy( thisPiece.finishLeftTopVertex );
						thisPiece.startLeftBottomVertex.copy( thisPiece.startLeftTopVertex );
						// Push the completed piece onto the list of pieces
						rrTrackPieces.push( thisPiece );
						// Update the "previous" path items so we can process the next small piece
						previousPiecePathFinishPoint.copy( thisPiece.piecePathFinishPoint );
						previousPiecePathFinishDirection.copy( thisPiece.piecePathFinishDirection );
					}
				}
				break;
			case "curveRight":
				// Get the radius of this section of curved track
				var currentPieceRadius = rrTrackLayout[ sectionIndex ].radius;
				// Figure the piece angle that will give the configured piece length at the given radius
				var fullPieceRadianAngle = ( rrTrackLayout[ 0 ].targetTrackPieceLength / currentPieceRadius );
				// Full pieces are the configured number of millimeters in arc length
				var fullPieceCount = Math.floor( ( rrTrackLayout[ sectionIndex ].degreeAngle * Math.PI / 180 ) / fullPieceRadianAngle );
				// Last piece is whatever it takes to make up the actual given curve angle
				var lastPieceRadianAngle = ( rrTrackLayout[ sectionIndex ].degreeAngle * Math.PI / 180 ) - ( fullPieceCount * fullPieceRadianAngle );
				for( var currentPiece = 0; currentPiece < ( fullPieceCount + 1 ); currentPiece++ ) {
					var currentPieceRadianAngle;
					if( currentPiece == fullPieceCount ) {
						// This is the odd-sized last piece
						currentPieceRadianAngle = lastPieceRadianAngle;
					} else {
						// This is just another full, one mm piece
						currentPieceRadianAngle = fullPieceRadianAngle;
					}
					// Screen out overly small last pieces
					if( currentPieceRadianAngle > 0.001 ) {
						// Make the object representing the current piece of track curve
						var thisPiece = new Object();
						thisPiece.pieceType = "curveRight";
						thisPiece.radianAngle = currentPieceRadianAngle;
						thisPiece.radius = currentPieceRadius;
						// Copy start point and direction from the previous piece's finish point and direction
						thisPiece.piecePathStartPoint = new THREE.Vector3();
						thisPiece.piecePathStartPoint.copy( previousPiecePathFinishPoint );
						thisPiece.piecePathStartDirection = new THREE.Vector3();
						thisPiece.piecePathStartDirection.copy( previousPiecePathFinishDirection );
						// Create the center point of the curve for this piece
						var centerPoint = new THREE.Vector3();
						// - make a vector from the start point to the center point
						var centerOffsetVector = new THREE.Vector3();
						centerOffsetVector.copy( thisPiece.piecePathStartDirection );	// get the piece's start direction
						centerOffsetVector.normalize();	// make it one unit long
						centerOffsetVector.applyAxisAngle( yAxisDirection, -Math.PI / 2 );	// rotate it 90 degrees clockwise = direction from path start point to center point
						centerOffsetVector.multiplyScalar( thisPiece.radius ); // give it a length equal to the distance from the center point to all points on the path
						centerPoint.addVectors( thisPiece.piecePathStartPoint, centerOffsetVector );	// set the center point at the sum of the start point location vector and the offset we just made
						// Create spoke vectors from the center point to points of interest on this piece ( midpoint vertex and path finish point )
						var startSpokeDirection = new THREE.Vector3();
						var middleSpokeDirection = new THREE.Vector3();
						var finishSpokeDirection = new THREE.Vector3();
						var middleSpokeEndpoint = new THREE.Vector3();
						var spokeWorkingVector = new THREE.Vector3();
						// "start spoke" is from the curve center point to the piece's path start point
						startSpokeDirection.copy( centerOffsetVector );	// get a copy of the vector from the path start point to the curve center point
						startSpokeDirection.normalize();	// normalize it to a length of 1
						startSpokeDirection.multiplyScalar( -1.0 );	// reverse it so it's pointing from the center point to the path start point
						// "middle spoke" is from the curve center point to the extra vertex at the midpoint of the left side
						middleSpokeDirection.copy( startSpokeDirection );	// copy the start spoke direction to the middle spoke
						middleSpokeDirection.applyAxisAngle( yAxisDirection, -( currentPieceRadianAngle / 2 ) );	// rotate it clockwise through half the curve angle
						// "finish spoke" is from the curve center point to the piece's path finish point
						finishSpokeDirection.copy( startSpokeDirection );	// copy the start spoke direction to the finish spoke
						finishSpokeDirection.applyAxisAngle( yAxisDirection, -currentPieceRadianAngle );	// rotate it clockwise through the curve angle
						// Locate an end point for middle spoke that's the midpoint of the left side
						spokeWorkingVector.copy( middleSpokeDirection );
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( Math.cos( currentPieceRadianAngle / 2 ) * ( currentPieceRadius - ( trackWidth / 2 ) ) );	// middle spoke direction with length to get from center to midpoint between vertex 1 and vertex 2
						middleSpokeEndpoint.addVectors( centerPoint, spokeWorkingVector );
						// Calculate this piece's finish point and direction
						thisPiece.piecePathFinishPoint = new THREE.Vector3();
						thisPiece.piecePathFinishDirection = new THREE.Vector3();
						spokeWorkingVector.copy( finishSpokeDirection );
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( currentPieceRadius );	// finish spoke direction from center point with length of curve radius
						thisPiece.piecePathFinishPoint.addVectors( centerPoint, spokeWorkingVector );
						// ... the finish direction is the start direction rotated clockwise (right curve) by the piece's angle
						thisPiece.piecePathFinishDirection.copy( thisPiece.piecePathStartDirection );
						thisPiece.piecePathFinishDirection.applyAxisAngle( yAxisDirection, -thisPiece.radianAngle );
						// Make the ten vertices of this small piece of right curve track
						thisPiece.startRightTopVertex = new THREE.Vector3();
						thisPiece.finishRightTopVertex = new THREE.Vector3();
						thisPiece.finishLeftTopVertex = new THREE.Vector3();
						thisPiece.midpointLeftTopVertex = new THREE.Vector3();
						thisPiece.startLeftTopVertex = new THREE.Vector3();
						thisPiece.startRightBottomVertex = new THREE.Vector3();
						thisPiece.finishRightBottomVertex = new THREE.Vector3();
						thisPiece.finishLeftBottomVertex = new THREE.Vector3();
						thisPiece.midpointLeftBottomVertex = new THREE.Vector3();
						thisPiece.startLeftBottomVertex = new THREE.Vector3();
						// Vertex 0 = start right top
						spokeWorkingVector.copy( startSpokeDirection );	// make a vector that reaches from the center to vertex 0
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( thisPiece.radius - ( trackWidth / 2 ) );
						thisPiece.startRightTopVertex.addVectors( centerPoint, spokeWorkingVector );	// place vertex 0
						// Vertex 1 = finish right top
						spokeWorkingVector.copy( finishSpokeDirection );	// make a vector that reaches from the center to vertex 1
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( thisPiece.radius - ( trackWidth / 2 ) );
						thisPiece.finishRightTopVertex.addVectors( centerPoint, spokeWorkingVector );	// place vertex 1
						// Vertex 2 = finish left top
						spokeWorkingVector.copy( finishSpokeDirection );	// make a vector that reaches from the center to vertex 2
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( thisPiece.radius + ( trackWidth / 2 ) );
						thisPiece.finishLeftTopVertex.addVectors( centerPoint, spokeWorkingVector );	// place vertex 2
						// Vertex 3 = midpoint left top
						spokeWorkingVector.copy( middleSpokeDirection );	// make a vector that reaches from the center to vertex 3
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( Math.cos( currentPieceRadianAngle / 2 ) * ( thisPiece.radius + ( trackWidth / 2 ) ) );
						thisPiece.midpointLeftTopVertex.addVectors( centerPoint, spokeWorkingVector );	// place vertex 3
						// Vertex 4 = start left top
						spokeWorkingVector.copy( startSpokeDirection );	// make a vector that reaches from the center to vertex 4
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( thisPiece.radius + ( trackWidth / 2 ) );
						thisPiece.startLeftTopVertex.addVectors( centerPoint, spokeWorkingVector );	// place vertex 4
						// (ignore the vertical differences for now...)
						// Vertex 5 = start right bottom
						thisPiece.startRightBottomVertex.copy( thisPiece.startRightTopVertex );
						// Vertex 6 = finish right bottom
						thisPiece.finishRightBottomVertex.copy( thisPiece.finishRightTopVertex );
						// Vertex 7 = finish left bottom
						thisPiece.finishLeftBottomVertex.copy( thisPiece.finishLeftTopVertex );
						// Vertex 8 = midpoint left bottom
						thisPiece.midpointLeftBottomVertex.copy( thisPiece.midpointLeftTopVertex );
						// Vertex 9 = start left bottom
						thisPiece.startLeftBottomVertex.copy( thisPiece.startLeftTopVertex );
						// Push the completed piece onto the list of pieces
						rrTrackPieces.push( thisPiece );
						// Update the "previous" path items so we can process the next small piece
						previousPiecePathFinishPoint.copy( thisPiece.piecePathFinishPoint );
						previousPiecePathFinishDirection.copy( thisPiece.piecePathFinishDirection );
					}
				}
				break;
			case "curveLeft":
				// Get the radius of this section of curved track
				var currentPieceRadius = rrTrackLayout[ sectionIndex ].radius;
				// Figure the piece angle that will give the configured piece length at the given radius
				var fullPieceRadianAngle = ( rrTrackLayout[ 0 ].targetTrackPieceLength / currentPieceRadius );
				// Full pieces are the configured number of millimeters in arc length
				var fullPieceCount = Math.floor( ( rrTrackLayout[ sectionIndex ].degreeAngle * Math.PI / 180 ) / fullPieceRadianAngle );
				// Last piece is whatever it takes to make up the actual given curve angle
				var lastPieceRadianAngle = ( rrTrackLayout[ sectionIndex ].degreeAngle * Math.PI / 180 ) - ( fullPieceCount * fullPieceRadianAngle );
				for( var currentPiece = 0; currentPiece < ( fullPieceCount + 1 ); currentPiece++ ) {
					var currentPieceRadianAngle;
					if( currentPiece == fullPieceCount ) {
						// This is the odd-sized last piece
						currentPieceRadianAngle = lastPieceRadianAngle;
					} else {
						// This is just another full, one mm piece
						currentPieceRadianAngle = fullPieceRadianAngle;
					}
					// Screen out overly small last pieces
					if( currentPieceRadianAngle > 0.001 ) {
						// Make the object representing the current piece of track curve
						var thisPiece = new Object();
						thisPiece.pieceType = "curveLeft";
						thisPiece.radianAngle = currentPieceRadianAngle;
						thisPiece.radius = currentPieceRadius;
						// Copy start point and direction from the previous piece's finish point and direction
						thisPiece.piecePathStartPoint = new THREE.Vector3();
						thisPiece.piecePathStartPoint.copy( previousPiecePathFinishPoint );
						thisPiece.piecePathStartDirection = new THREE.Vector3();
						thisPiece.piecePathStartDirection.copy( previousPiecePathFinishDirection );
						// Create the center point of the curve for this piece
						var centerPoint = new THREE.Vector3();
						// - make a vector from the start point to the center point
						var centerOffsetVector = new THREE.Vector3();
						centerOffsetVector.copy( thisPiece.piecePathStartDirection );	// get the piece's start direction
						centerOffsetVector.normalize();	// make it one unit long
						centerOffsetVector.applyAxisAngle( yAxisDirection, Math.PI / 2 );	// rotate it 90 degrees counter-clockwise = direction from path start point to center point
						centerOffsetVector.multiplyScalar( thisPiece.radius ); // give it a length equal to the distance from the center point to all points on the path
						centerPoint.addVectors( thisPiece.piecePathStartPoint, centerOffsetVector );	// set the center point at the sum of the start point location vector and the offset we just made
						// Create spoke vectors from the center point to points of interest on this piece ( midpoint vertex and path finish point )
						var startSpokeDirection = new THREE.Vector3();
						var middleSpokeDirection = new THREE.Vector3();
						var finishSpokeDirection = new THREE.Vector3();
						var middleSpokeEndpoint = new THREE.Vector3();
						var spokeWorkingVector = new THREE.Vector3();
						// "start spoke" is from the curve center point to the piece's path start point
						startSpokeDirection.copy( centerOffsetVector );	// get a copy of the vector from the path start point to the curve center point
						startSpokeDirection.normalize();	// normalize it to a length of 1
						startSpokeDirection.multiplyScalar( -1.0 );	// reverse it so it's pointing from the center point to the path start point
						// "middle spoke" is from the curve center point to the extra vertex at the midpoint of the left side
						middleSpokeDirection.copy( startSpokeDirection );	// copy the start spoke direction to the middle spoke
						middleSpokeDirection.applyAxisAngle( yAxisDirection, ( currentPieceRadianAngle / 2 ) );	// rotate it clockwise through half the curve angle
						// "finish spoke" is from the curve center point to the piece's path finish point
						finishSpokeDirection.copy( startSpokeDirection );	// copy the start spoke direction to the finish spoke
						finishSpokeDirection.applyAxisAngle( yAxisDirection, currentPieceRadianAngle );	// rotate it clockwise through the curve angle
						// Locate an end point for middle spoke that's the midpoint of the left side
						spokeWorkingVector.copy( middleSpokeDirection );
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( Math.cos( currentPieceRadianAngle / 2 ) * ( currentPieceRadius - ( trackWidth / 2 ) ) );	// middle spoke direction with length to get from center to midpoint between vertex 1 and vertex 2
						middleSpokeEndpoint.addVectors( centerPoint, spokeWorkingVector );
						// Calculate this piece's finish point and direction
						thisPiece.piecePathFinishPoint = new THREE.Vector3();
						thisPiece.piecePathFinishDirection = new THREE.Vector3();
						spokeWorkingVector.copy( finishSpokeDirection );
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( currentPieceRadius );	// finish spoke direction from center point with length of curve radius
						thisPiece.piecePathFinishPoint.addVectors( centerPoint, spokeWorkingVector );
						// ... the finish direction is the start direction rotated counter-clockwise (left curve) by the piece's angle
						thisPiece.piecePathFinishDirection.copy( thisPiece.piecePathStartDirection );
						thisPiece.piecePathFinishDirection.applyAxisAngle( yAxisDirection, thisPiece.radianAngle );
						// Make the ten vertices of this small piece of right curve track
						thisPiece.startRightTopVertex = new THREE.Vector3();
						thisPiece.midpointRightTopVertex = new THREE.Vector3();
						thisPiece.finishRightTopVertex = new THREE.Vector3();
						thisPiece.finishLeftTopVertex = new THREE.Vector3();
						thisPiece.startLeftTopVertex = new THREE.Vector3();
						thisPiece.startRightBottomVertex = new THREE.Vector3();
						thisPiece.midpointRightBottomVertex = new THREE.Vector3();
						thisPiece.finishRightBottomVertex = new THREE.Vector3();
						thisPiece.finishLeftBottomVertex = new THREE.Vector3();
						thisPiece.startLeftBottomVertex = new THREE.Vector3();
						// Vertex 0 = start right top
						spokeWorkingVector.copy( startSpokeDirection );	// make a vector that reaches from the center to vertex 0
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( thisPiece.radius + ( trackWidth / 2 ) );
						thisPiece.startRightTopVertex.addVectors( centerPoint, spokeWorkingVector );	// place vertex 0
						// Vertex 1 = midpoint right top
						spokeWorkingVector.copy( middleSpokeDirection );	// make a vector that reaches from the center to vertex 1
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( Math.cos( currentPieceRadianAngle / 2 ) * ( thisPiece.radius + ( trackWidth / 2 ) ) );
						thisPiece.midpointRightTopVertex.addVectors( centerPoint, spokeWorkingVector );	// place vertex 1
						// Vertex 2 = finish right top
						spokeWorkingVector.copy( finishSpokeDirection );	// make a vector that reaches from the center to vertex 2
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( thisPiece.radius + ( trackWidth / 2 ) );
						thisPiece.finishRightTopVertex.addVectors( centerPoint, spokeWorkingVector );	// place vertex 2
						// Vertex 3 = finish left top
						spokeWorkingVector.copy( finishSpokeDirection );	// make a vector that reaches from the center to vertex 3
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( thisPiece.radius - ( trackWidth / 2 ) );
						thisPiece.finishLeftTopVertex.addVectors( centerPoint, spokeWorkingVector );	// place vertex 3
						// Vertex 4 = start left top
						spokeWorkingVector.copy( startSpokeDirection );	// make a vector that reaches from the center to vertex 4
						spokeWorkingVector.normalize();
						spokeWorkingVector.multiplyScalar( thisPiece.radius - ( trackWidth / 2 ) );
						thisPiece.startLeftTopVertex.addVectors( centerPoint, spokeWorkingVector );	// place vertex 4
						// (ignore vertical distances for now...)
						// Vertex 5 = start right bottom
						thisPiece.startRightBottomVertex.copy( thisPiece.startRightTopVertex );
						// Vertex 6 = midpoint right bottom
						thisPiece.midpointRightBottomVertex.copy( thisPiece.midpointRightTopVertex );
						// Vertex 7 = finish right bottom
						thisPiece.finishRightBottomVertex.copy( thisPiece.finishRightTopVertex );
						// Vertex 8 = finish left bottom
						thisPiece.finishLeftBottomVertex.copy( thisPiece.finishLeftTopVertex );
						// Vertex 9 = start left bottom
						thisPiece.startLeftBottomVertex.copy( thisPiece.startLeftTopVertex );
						// Push the completed piece onto the list of pieces
						rrTrackPieces.push( thisPiece );
						// Update the "previous" path items so we can process the next small piece
						previousPiecePathFinishPoint.copy( thisPiece.piecePathFinishPoint );
						previousPiecePathFinishDirection.copy( thisPiece.piecePathFinishDirection );
					}
				}
				break;
			default:
				alert( "I should not be here ( figureTrackPieces()-switch-default )" );
				break;
		}
		// Record the piece index where this section ends
		rrTrackLayout[ sectionIndex ].endPieceIndex = rrTrackPieces.length - 1;
	}
};

// Traverse a track layout list and track small pieces and generate elevations for each track path point that give both
//	smooth slope changes and the desired rise and fall per track section given in the track layout list
function figureTrackElevations() {
	// If the current section has zero rise or fall then the entire section is declared flat and all of its
	//	pieces have the same elevation. Otherwise:
	// ...if the bordering section (on either side) is flat (has no rise or fall), all the elevation smoothing adjustment is done in
	//	this current section - which is to say that the point where the two sections meet is assigned
	//	a slope of zero.
	// If the bordering section has a rise or fall, the point where the two sections meet is assigned a slope which
	//	is equal to the average of that section's overall slope and this section's overall slope. "Overall slope" here
	//	is taken as the rise or fall of the section divided by the length of the section.
	var previousSectionRise, currentSectionRise, nextSectionRise;
	var previousSectionLength, currentSectionLength, nextSectionLength;
	var previousSectionSlopeDegreeAngle, currentSectionSlopeDegreeAngle, nextSectionSlopeDegreeAngle;
	var currentSectionStartingSlopeDegreeAngle, currentSectionEndingSlopeDegreeAngle;
	var previousSectionIndex, nextSectionIndex;
	var sectionStartElevation, sectionEndElevation;
	// Traverse all the sections in the track adjusting piece start/finish elevations as needed
	for( var currentSectionIndex = 2; currentSectionIndex < rrTrackLayout.length; currentSectionIndex++ ) {
		// Assign the elevation of the first piece of the current section...
		//	if this is the first section then the starting elevation is that of the track's origin point
		//	otherwise the starting elevation is the ending elevation of the last piece in the previous section
		if( currentSectionIndex == 2 ) {
			// This is the first section of the track, use the track origin elevation
			sectionStartElevation = rrTrackLayout[ 1 ].location.y;
			rrTrackPieces[ 0 ].piecePathStartPoint.y = rrTrackLayout[ 1 ].location.y;
		} else {
			// This is some other section of track, use the previous section's last-piece-finish-path-point elevation
			sectionStartElevation = rrTrackPieces[ rrTrackLayout[ currentSectionIndex - 1 ].endPieceIndex ].piecePathFinishPoint.y;
		}
		// Assign this starting elevation to the path start point of the track small piece at the beginning of this section
		rrTrackPieces[ rrTrackLayout[ currentSectionIndex ].beginPieceIndex ].piecePathStartPoint.y = sectionStartElevation;
		// If this is a section of track with no rise or fall, set all the path points in it to the same elevation and return because we're done
		if( rrTrackLayout[ currentSectionIndex ].rise == 0 ) {
			for( var currentPiece = rrTrackLayout[ currentSectionIndex ].beginPieceIndex; currentPiece <= rrTrackLayout[ currentSectionIndex ].endPieceIndex; currentPiece++ ) {
				rrTrackPieces[ currentPiece ].piecePathStartPoint.y = sectionStartElevation;
				rrTrackPieces[ currentPiece ].piecePathFinishPoint.y = sectionStartElevation;
			}
		} else {
			// Since this is not a flat section, determine which sections border this section
			// - start by assuming we're not at the beginning or end of the track layout
			previousSectionIndex = currentSectionIndex - 1;
			nextSectionIndex = currentSectionIndex + 1;
			// - now check to see if we need to adjust that assumption...
			if( currentSectionIndex == 2 ) {
				// The current section is the first section of the track so the previous section is actually the last section of track
				previousSectionIndex = rrTrackLayout.length - 1;
			}
			if( currentSectionIndex == ( rrTrackLayout.length - 1 ) ) {
				// The current section is the last section of the track so the next section is actually the first section of track
				nextSectionIndex = 2;
			}
			// Figure the raw slopes of our three sections
			previousSectionLength = sectionLength( previousSectionIndex );
			currentSectionLength = sectionLength( currentSectionIndex );
			nextSectionLength = sectionLength( nextSectionIndex );
			previousSectionRise = rrTrackLayout[ previousSectionIndex ].rise;
			currentSectionRise = rrTrackLayout[ currentSectionIndex ].rise;
			nextSectionRise = rrTrackLayout[ nextSectionIndex ].rise;
			previousSectionSlopeDegreeAngle = Math.atan( previousSectionRise / previousSectionLength ) * 180 / Math.PI;
			currentSectionSlopeDegreeAngle = Math.atan( currentSectionRise / currentSectionLength ) * 180 / Math.PI;
			nextSectionSlopeDegreeAngle = Math.atan( nextSectionRise / nextSectionLength ) * 180 / Math.PI;
			// Figure the starting and ending slopes for the current section
			if( Math.abs( previousSectionSlopeDegreeAngle ) < rrTrackLayout[ 0 ].pieceSlopeIncrementDegreeAngle ) {
				// the previous section has close enough to zero slope
				currentSectionStartingSlopeDegreeAngle = 0;
			} else {
				// the previous section also has some slope so average it with the current section and start with that
				currentSectionStartingSlopeDegreeAngle = ( previousSectionSlopeDegreeAngle + currentSectionSlopeDegreeAngle ) / 2;
			}
			if( Math.abs( nextSectionSlopeDegreeAngle ) < rrTrackLayout[ 0 ].pieceSlopeIncrementDegreeAngle ) {
				// the next section has close enough to zero slope
				currentSectionEndingSlopeDegreeAngle = 0;
			} else {
				// the next section also has some slope so average it with the current section and end with that
				currentSectionEndingSlopeDegreeAngle = ( nextSectionSlopeDegreeAngle + currentSectionSlopeDegreeAngle ) / 2;
			}
			// We figured the start elevation of this section above - now add this section's rise to get the section's ending elevation
			sectionEndElevation = sectionStartElevation + rrTrackLayout[ currentSectionIndex ].rise;
			// ... copy the section end elevation to the end of the last small piece of the section
			rrTrackPieces[ rrTrackLayout[ currentSectionIndex ].endPieceIndex ].piecePathFinishPoint.y = sectionEndElevation;
			// Now begin at the starting and ending path points of this section and iterate elevations toward the
			//	center until the section is reasonably smooth vertically
			// The initial center region is the entire section
			var iterationStartElevation = sectionStartElevation;
			var iterationEndElevation = sectionEndElevation;
			var iterationStartingSlopeDegreeAngle = currentSectionStartingSlopeDegreeAngle;
			var iterationEndingSlopeDegreeAngle = currentSectionEndingSlopeDegreeAngle;
			var iterationStartingPieceIndex = rrTrackLayout[ currentSectionIndex ].beginPieceIndex;
			var iterationEndingPieceIndex = rrTrackLayout[ currentSectionIndex ].endPieceIndex;
			var nextStartingSlopeDegreeAngle, nextEndingSlopeDegreeAngle;
			var finished = false, overFlowed = false, loopLimit = 0;
			while( !finished ) {
				// Find the effective slope of this iteration's entire center (i.e. so-far-unprocessed) region
				// ... in each iteration, this "center gap" includes the starting and ending pieces and
				// ... extends from the pathStartPoint of the starting piece to the pathFinishPoint of the ending piece
				var iterationCenterRise = iterationEndElevation - iterationStartElevation;
				var iterationCenterLength = iterationGapLength( iterationStartingPieceIndex, iterationEndingPieceIndex );
				var iterationCenterSlopeDegreeAngle = Math.atan( iterationCenterRise / iterationCenterLength ) * 180 / Math.PI;
				var iterationStartingSlopeVariance = Math.abs( iterationCenterSlopeDegreeAngle - iterationStartingSlopeDegreeAngle );
				var iterationEndingSlopeVariance  = Math.abs( iterationCenterSlopeDegreeAngle - iterationEndingSlopeDegreeAngle );
				// If the variance in slope of the center region and each end piece is less than one degree, we're done with smoothing.
				//	if it's not, then we need to put a one degree slope change on the end small piece(s), re-figure what the
				//	remaining gap is and try again.
				if( ( iterationStartingSlopeVariance < rrTrackLayout[ 0 ].pieceSlopeIncrementDegreeAngle ) &&
					( iterationEndingSlopeVariance < rrTrackLayout[ 0 ].pieceSlopeIncrementDegreeAngle ) ) {
					// It's smooth enough now
					finished = true;
				} else {
					if( iterationStartingSlopeVariance >= rrTrackLayout[ 0 ].pieceSlopeIncrementDegreeAngle ) {
						// We need to adjust the starting piece and iterate again
						// Adjust the starting slope by one degree in the needed direction
						// Get the starting slope in degrees
						var adjustmentSlopeDegreeAngle = iterationStartingSlopeDegreeAngle;
						// Shift it one degree toward the center gap slope
						if( iterationCenterSlopeDegreeAngle > adjustmentSlopeDegreeAngle ) {
							adjustmentSlopeDegreeAngle += rrTrackLayout[ 0 ].pieceSlopeIncrementDegreeAngle;
						} else {
							adjustmentSlopeDegreeAngle -= rrTrackLayout[ 0 ].pieceSlopeIncrementDegreeAngle;
						}
						// This becomes the starting slope for the next iteration
						nextStartingSlopeDegreeAngle = adjustmentSlopeDegreeAngle;
						// Using the original starting slope, figure the elevation change over the piece that we're about to remove from the center gap
						var iterationStartingPieceRise = smallPieceLength( iterationStartingPieceIndex ) * Math.tan( Math.PI * iterationStartingSlopeDegreeAngle / 180 );
						// And apply that elevation change to the end of this piece and copy it to the start of the next piece
						rrTrackPieces[ iterationStartingPieceIndex ].piecePathFinishPoint.y = rrTrackPieces[ iterationStartingPieceIndex ].piecePathStartPoint.y + iterationStartingPieceRise;
						rrTrackPieces[ iterationStartingPieceIndex + 1 ].piecePathStartPoint.y = rrTrackPieces[ iterationStartingPieceIndex ].piecePathFinishPoint.y;
						// Now step past this piece to set up for the next iteration
						iterationStartingPieceIndex++;
						iterationStartingSlopeDegreeAngle = nextStartingSlopeDegreeAngle;
					}
					if( iterationEndingSlopeVariance >= rrTrackLayout[ 0 ].pieceSlopeIncrementDegreeAngle ) {
						// We need to adjust the ending piece and iterate again
						// Adjust the ending slope by one degree in the needed direction
						// ( same logic as above for starting slope )
						var adjustmentSlopeDegreeAngle = iterationEndingSlopeDegreeAngle;
						if( iterationCenterSlopeDegreeAngle > adjustmentSlopeDegreeAngle ) {
							adjustmentSlopeDegreeAngle += rrTrackLayout[ 0 ].pieceSlopeIncrementDegreeAngle;
						} else {
							adjustmentSlopeDegreeAngle -= rrTrackLayout[ 0 ].pieceSlopeIncrementDegreeAngle;
						}
						nextEndingSlopeDegreeAngle = adjustmentSlopeDegreeAngle;
						// Figure the elevation change for the ending piece we're about to declare processed
						var iterationEndingPieceRise = smallPieceLength( iterationEndingPieceIndex ) * Math.tan( Math.PI * iterationEndingSlopeDegreeAngle / 180 );
						rrTrackPieces[ iterationEndingPieceIndex ].piecePathStartPoint.y = rrTrackPieces[ iterationEndingPieceIndex ].piecePathFinishPoint.y - iterationEndingPieceRise;
						rrTrackPieces[ iterationEndingPieceIndex - 1 ].piecePathFinishPoint.y = rrTrackPieces[ iterationEndingPieceIndex ].piecePathStartPoint.y;
						iterationEndingPieceIndex--;
						iterationEndingSlopeDegreeAngle = nextEndingSlopeDegreeAngle;
					}
				}
				loopLimit++;
				if( loopLimit > 500 ) {
					overFlowed = true;
					finished = true;
				}
				if( overFlowed ) {
					alert( "I should not be here - overflowed in figureTrackElevations()" );
				}
				// Now that the smoothing is done, fill in the remaining center gap with simple linear sloping
				// A linear slope from the pathStartPoint of the last iteration's beginning piece to the
				//	pathFinishPoint of the last iteration's ending piece will do nicely.
				var remainingRise = rrTrackPieces[ iterationEndingPieceIndex ].piecePathFinishPoint.y - rrTrackPieces[ iterationStartingPieceIndex ].piecePathStartPoint.y;
				var remainingPieceCount = iterationEndingPieceIndex - iterationStartingPieceIndex + 1;
				var incrementalRise = remainingRise / remainingPieceCount;
				// Traverse all the pieces remaining in the center gap of the section and assign linearly increasing elevations
				for( var currentPieceIndex = iterationStartingPieceIndex; currentPieceIndex <= iterationEndingPieceIndex; currentPieceIndex++ ) {
					// Insert the incremental rise in the current piece
					rrTrackPieces[ currentPieceIndex ].piecePathFinishPoint.y = rrTrackPieces[ currentPieceIndex ].piecePathStartPoint.y + incrementalRise;
					// IF the current piece is NOT the last piece in the center gap, copy the ending elevation of the current piece into the beginning elevation of the next piece
					if( currentPieceIndex != iterationEndingPieceIndex ) {
						rrTrackPieces[ currentPieceIndex + 1 ].piecePathStartPoint.y = rrTrackPieces[ currentPieceIndex ].piecePathFinishPoint.y;
					}
				}
			}
		}
	}
};

// Apply the track elevations assigned to the track path points to the corresponding vertices needed for mesh and body generation
function copyPathElevationsToVertices() {
	for( var currentPieceIndex = 0; currentPieceIndex < rrTrackPieces.length; currentPieceIndex++ ) {
		var pathPieceStartTopElevation = rrTrackPieces[ currentPieceIndex ].piecePathStartPoint.y;
		var pathPieceStartBottomElevation = pathPieceStartTopElevation - rrTrackLayout[ 0 ].trackThickness;
		var pathPieceFinishTopElevation = rrTrackPieces[ currentPieceIndex ].piecePathFinishPoint.y;
		var pathPieceFinishBottomElevation = pathPieceFinishTopElevation - rrTrackLayout[ 0 ].trackThickness;
		var pathPieceMidpointTopElevation = ( ( pathPieceStartTopElevation + pathPieceFinishTopElevation ) / 2 );
		var pathPieceMidpointBottomElevation = pathPieceMidpointTopElevation - rrTrackLayout[ 0 ].trackThickness;
		switch( rrTrackPieces[ currentPieceIndex ].pieceType ) {
			case "straight":
				rrTrackPieces[ currentPieceIndex ].startRightTopVertex.y = pathPieceStartTopElevation;
				rrTrackPieces[ currentPieceIndex ].finishRightTopVertex.y = pathPieceFinishTopElevation;
				rrTrackPieces[ currentPieceIndex ].finishLeftTopVertex.y = pathPieceFinishTopElevation;
				rrTrackPieces[ currentPieceIndex ].startLeftTopVertex.y = pathPieceStartTopElevation;
				rrTrackPieces[ currentPieceIndex ].startRightBottomVertex.y = pathPieceStartBottomElevation;
				rrTrackPieces[ currentPieceIndex ].finishRightBottomVertex.y = pathPieceFinishBottomElevation;
				rrTrackPieces[ currentPieceIndex ].finishLeftBottomVertex.y = pathPieceFinishBottomElevation;
				rrTrackPieces[ currentPieceIndex ].startLeftBottomVertex.y = pathPieceStartBottomElevation;
				break;
			case "curveRight":
				rrTrackPieces[ currentPieceIndex ].startRightTopVertex.y = pathPieceStartTopElevation;
				rrTrackPieces[ currentPieceIndex ].finishRightTopVertex.y = pathPieceFinishTopElevation;
				rrTrackPieces[ currentPieceIndex ].finishLeftTopVertex.y = pathPieceFinishTopElevation;
				rrTrackPieces[ currentPieceIndex ].midpointLeftTopVertex.y = pathPieceMidpointTopElevation;
				rrTrackPieces[ currentPieceIndex ].startLeftTopVertex.y = pathPieceStartTopElevation;
				rrTrackPieces[ currentPieceIndex ].startRightBottomVertex.y = pathPieceStartBottomElevation;
				rrTrackPieces[ currentPieceIndex ].finishRightBottomVertex.y = pathPieceFinishBottomElevation;
				rrTrackPieces[ currentPieceIndex ].finishLeftBottomVertex.y = pathPieceFinishBottomElevation;
				rrTrackPieces[ currentPieceIndex ].midpointLeftBottomVertex.y = pathPieceMidpointBottomElevation;
				rrTrackPieces[ currentPieceIndex ].startLeftBottomVertex.y = pathPieceStartBottomElevation;
				break;
			case "curveLeft":
				rrTrackPieces[ currentPieceIndex ].startRightTopVertex.y = pathPieceStartTopElevation;
				rrTrackPieces[ currentPieceIndex ].midpointRightTopVertex.y = pathPieceMidpointTopElevation;
				rrTrackPieces[ currentPieceIndex ].finishRightTopVertex.y = pathPieceFinishTopElevation;
				rrTrackPieces[ currentPieceIndex ].finishLeftTopVertex.y = pathPieceFinishTopElevation;
				rrTrackPieces[ currentPieceIndex ].startLeftTopVertex.y = pathPieceStartTopElevation;
				rrTrackPieces[ currentPieceIndex ].startRightBottomVertex.y = pathPieceStartBottomElevation;
				rrTrackPieces[ currentPieceIndex ].midpointRightBottomVertex.y = pathPieceMidpointBottomElevation;
				rrTrackPieces[ currentPieceIndex ].finishRightBottomVertex.y = pathPieceFinishBottomElevation;
				rrTrackPieces[ currentPieceIndex ].finishLeftBottomVertex.y = pathPieceFinishBottomElevation;
				rrTrackPieces[ currentPieceIndex ].startLeftBottomVertex.y = pathPieceStartBottomElevation;
				break;
			default:
				alert( "I should not be here ( makeTrackMeshAndBody()-switch-default )" );
				break;
		}
	}
};

// Now that the path points of the pieces have all three dimensions figured out, generate the centers of the pieces
//	using the start and finish path points.
function figureTrackPieceCenters() {
	// We take the center of each piece - straight or curve - to be the midpoint between the track path start and
	//	track path finish points dropped vertically by half the track thickness
	for( currentPieceIndex = 0; currentPieceIndex < rrTrackPieces.length; currentPieceIndex++ ) {
		// Make a vector running from the piece's path start point to the piece's path end point
		var trackPiecePath = new THREE.Vector3();
		trackPiecePath.subVectors( rrTrackPieces[ currentPieceIndex ].piecePathFinishPoint, rrTrackPieces[ currentPieceIndex ].piecePathStartPoint );
		// Cut the length of that vector in half
		trackPiecePath.multiplyScalar( 0.5 );
		// Make a vector by adding this new vector to the piece's path start point.
		var trackPieceCenterPoint = new THREE.Vector3();
		trackPieceCenterPoint.addVectors( rrTrackPieces[ currentPieceIndex ].piecePathStartPoint, trackPiecePath );
		// Now drop that vector vertically by half the thickness of the track piece
		trackPieceCenterPoint.y -= ( rrTrackLayout[ 0 ].trackThickness / 2 );
		// The result is the global location of the center of the piece
		rrTrackPieces[ currentPieceIndex ].center = trackPieceCenterPoint;
	}
};

// Traverse a track layout list of small pieces and generate the corresponding meshes to be rendered and bodies for physics functions
// Our track layout system generates the vertices of track pieces in global coordinates. Both Three.js and Cannon.js operate with vertices
//	specified relative to the center of the piece and use the piece position ( the global coordinates of the center of the piece) to come
//	up with the global vertex coordinates.
function makeTrackMeshesAndBodies() {
	for( var currentPieceIndex = 0; currentPieceIndex < rrTrackPieces.length; currentPieceIndex++ ) {
		var trackPieceGeometry = new THREE.Geometry();
		switch( rrTrackPieces[ currentPieceIndex ].pieceType ) {
			case "straight":
				// The mesh for a small piece of straight track has eight vertices and eight triangular faces
				var localMeshVertex0 = new THREE.Vector3();
				var localMeshVertex1 = new THREE.Vector3();
				var localMeshVertex2 = new THREE.Vector3();
				var localMeshVertex3 = new THREE.Vector3();
				var localMeshVertex4 = new THREE.Vector3();
				var localMeshVertex5 = new THREE.Vector3();
				var localMeshVertex6 = new THREE.Vector3();
				var localMeshVertex7 = new THREE.Vector3();
				localMeshVertex0.subVectors( rrTrackPieces[ currentPieceIndex ].startRightTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex1.subVectors( rrTrackPieces[ currentPieceIndex ].finishRightTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex2.subVectors( rrTrackPieces[ currentPieceIndex ].finishLeftTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex3.subVectors( rrTrackPieces[ currentPieceIndex ].startLeftTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex4.subVectors( rrTrackPieces[ currentPieceIndex ].startRightBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex5.subVectors( rrTrackPieces[ currentPieceIndex ].finishRightBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex6.subVectors( rrTrackPieces[ currentPieceIndex ].finishLeftBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex7.subVectors( rrTrackPieces[ currentPieceIndex ].startLeftBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				trackPieceGeometry.vertices.push(
					localMeshVertex0,
					localMeshVertex1,
					localMeshVertex2,
					localMeshVertex3,
					localMeshVertex4,
					localMeshVertex5,
					localMeshVertex6,
					localMeshVertex7
				 );
				trackPieceGeometry.faces.push(
					new THREE.Face3( 0, 2, 3 ),
					new THREE.Face3( 0, 1, 2 ),
					new THREE.Face3( 4, 7, 6 ),
					new THREE.Face3( 4, 6, 5 ),
					new THREE.Face3( 0, 5, 1 ),
					new THREE.Face3( 0, 4, 5 ),
					new THREE.Face3( 3, 6, 7 ),
					new THREE.Face3( 3, 2, 6 )
				);
				// The body for a small piece of straight track has eight vertices and six four-sided faces
				var localBodyVertex0 = new CANNON.Vec3(), localBodyVertex1 = new CANNON.Vec3(), localBodyVertex2 = new CANNON.Vec3(), localBodyVertex3 = new CANNON.Vec3(), localBodyVertex4 = new CANNON.Vec3();
				var localBodyVertex5 = new CANNON.Vec3(), localBodyVertex6 = new CANNON.Vec3(), localBodyVertex7 = new CANNON.Vec3();
				localBodyVertex0.copy( localMeshVertex0 );
				localBodyVertex1.copy( localMeshVertex1 );
				localBodyVertex2.copy( localMeshVertex2 );
				localBodyVertex3.copy( localMeshVertex3 );
				localBodyVertex4.copy( localMeshVertex4 );
				localBodyVertex5.copy( localMeshVertex5 );
				localBodyVertex6.copy( localMeshVertex6 );
				localBodyVertex7.copy( localMeshVertex7 );
				var trackPieceBodyPoints = [
					localBodyVertex0,
					localBodyVertex1,
					localBodyVertex2,
					localBodyVertex3,
					localBodyVertex4,
					localBodyVertex5,
					localBodyVertex6,
					localBodyVertex7
					];
				var trackPieceBodyFaces = [
					[ 0, 3, 7, 4 ],
					[ 1, 5, 6, 2 ],
					[ 2, 6, 7, 3 ],
					[ 0, 4, 5, 1 ],
					[ 0, 1, 2, 3 ],
					[ 4, 7, 6, 5 ]
				];
				break;
			case "curveRight":
				// The mesh for a small piece of curve track has ten vertices and ten triangular faces
				var localMeshVertex0 = new THREE.Vector3();
				var localMeshVertex1 = new THREE.Vector3();
				var localMeshVertex2 = new THREE.Vector3();
				var localMeshVertex3 = new THREE.Vector3();
				var localMeshVertex4 = new THREE.Vector3();
				var localMeshVertex5 = new THREE.Vector3();
				var localMeshVertex6 = new THREE.Vector3();
				var localMeshVertex7 = new THREE.Vector3();
				var localMeshVertex8 = new THREE.Vector3();
				var localMeshVertex9 = new THREE.Vector3();
				localMeshVertex0.subVectors( rrTrackPieces[ currentPieceIndex ].startRightTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex1.subVectors( rrTrackPieces[ currentPieceIndex ].finishRightTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex2.subVectors( rrTrackPieces[ currentPieceIndex ].finishLeftTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex3.subVectors( rrTrackPieces[ currentPieceIndex ].midpointLeftTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex4.subVectors( rrTrackPieces[ currentPieceIndex ].startLeftTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex5.subVectors( rrTrackPieces[ currentPieceIndex ].startRightBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex6.subVectors( rrTrackPieces[ currentPieceIndex ].finishRightBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex7.subVectors( rrTrackPieces[ currentPieceIndex ].finishLeftBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex8.subVectors( rrTrackPieces[ currentPieceIndex ].midpointLeftBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex9.subVectors( rrTrackPieces[ currentPieceIndex ].startLeftBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				trackPieceGeometry.vertices.push(
					localMeshVertex0,
					localMeshVertex1,
					localMeshVertex2,
					localMeshVertex3,
					localMeshVertex4,
					localMeshVertex5,
					localMeshVertex6,
					localMeshVertex7,
					localMeshVertex8,
					localMeshVertex9
				 );
				trackPieceGeometry.faces.push(
					new THREE.Face3( 0, 3, 4 ),
					new THREE.Face3( 0, 1, 3 ),
					new THREE.Face3( 1, 2, 3 ),
					new THREE.Face3( 5, 9, 8 ),
					new THREE.Face3( 5, 8, 6 ),
					new THREE.Face3( 6, 8, 7 ),
					new THREE.Face3( 0, 5, 1 ),
					new THREE.Face3( 1, 5, 6 ),
					new THREE.Face3( 2, 9, 4 ),
					new THREE.Face3( 2, 7, 9 )
				);
				// The body for a small piece of curve track has eight vertices and six four-sided faces...
				//  the midpoints used in the mesh are omitted in the body
				var localBodyVertex0 = new CANNON.Vec3(), localBodyVertex1 = new CANNON.Vec3(), localBodyVertex2 = new CANNON.Vec3(), localBodyVertex3 = new CANNON.Vec3(), localBodyVertex4 = new CANNON.Vec3();
				var localBodyVertex5 = new CANNON.Vec3(), localBodyVertex6 = new CANNON.Vec3(), localBodyVertex7 = new CANNON.Vec3();
				localBodyVertex0.copy( localMeshVertex0 );
				localBodyVertex1.copy( localMeshVertex1 );
				localBodyVertex2.copy( localMeshVertex2 );
				// omit mesh vertex 3 = left top midpoint
				localBodyVertex3.copy( localMeshVertex4 );
				localBodyVertex4.copy( localMeshVertex5 );
				localBodyVertex5.copy( localMeshVertex6 );
				localBodyVertex6.copy( localMeshVertex7 );
				// omit mesh vertex 8 = left bottom midpoint
				localBodyVertex7.copy( localMeshVertex9 );
				var trackPieceBodyPoints = [
					localBodyVertex0,
					localBodyVertex1,
					localBodyVertex2,
					localBodyVertex3,
					localBodyVertex4,
					localBodyVertex5,
					localBodyVertex6,
					localBodyVertex7
					];
				var trackPieceBodyFaces = [
					[ 0, 3, 7, 4 ],
					[ 1, 5, 6, 2 ],
					[ 2, 6, 7, 3 ],
					[ 0, 4, 5, 1 ],
					[ 0, 1, 2, 3 ],
					[ 4, 7, 6, 5 ]
				];
				break;
			case "curveLeft":
				// The mesh for a small piece of curve track has ten vertices and ten triangular faces
				var localMeshVertex0 = new THREE.Vector3();
				var localMeshVertex1 = new THREE.Vector3();
				var localMeshVertex2 = new THREE.Vector3();
				var localMeshVertex3 = new THREE.Vector3();
				var localMeshVertex4 = new THREE.Vector3();
				var localMeshVertex5 = new THREE.Vector3();
				var localMeshVertex6 = new THREE.Vector3();
				var localMeshVertex7 = new THREE.Vector3();
				var localMeshVertex8 = new THREE.Vector3();
				var localMeshVertex9 = new THREE.Vector3();
				localMeshVertex0.subVectors( rrTrackPieces[ currentPieceIndex ].startRightTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex1.subVectors( rrTrackPieces[ currentPieceIndex ].midpointRightTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex2.subVectors( rrTrackPieces[ currentPieceIndex ].finishRightTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex3.subVectors( rrTrackPieces[ currentPieceIndex ].finishLeftTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex4.subVectors( rrTrackPieces[ currentPieceIndex ].startLeftTopVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex5.subVectors( rrTrackPieces[ currentPieceIndex ].startRightBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex6.subVectors( rrTrackPieces[ currentPieceIndex ].midpointRightBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex7.subVectors( rrTrackPieces[ currentPieceIndex ].finishRightBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex8.subVectors( rrTrackPieces[ currentPieceIndex ].finishLeftBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				localMeshVertex9.subVectors( rrTrackPieces[ currentPieceIndex ].startLeftBottomVertex, rrTrackPieces[ currentPieceIndex ].center );
				trackPieceGeometry.vertices.push(
					localMeshVertex0,
					localMeshVertex1,
					localMeshVertex2,
					localMeshVertex3,
					localMeshVertex4,
					localMeshVertex5,
					localMeshVertex6,
					localMeshVertex7,
					localMeshVertex8,
					localMeshVertex9
				 );
				trackPieceGeometry.faces.push(
					new THREE.Face3( 0, 1, 4 ),
					new THREE.Face3( 1, 3, 4 ),
					new THREE.Face3( 1, 2, 3 ),
					new THREE.Face3( 5, 9, 6 ),
					new THREE.Face3( 6, 9, 8 ),
					new THREE.Face3( 6, 8, 7 ),
					new THREE.Face3( 0, 5, 2 ),
					new THREE.Face3( 2, 5, 7 ),
					new THREE.Face3( 3, 9, 4 ),
					new THREE.Face3( 3, 8, 9 )
				);
				// The body for a small piece of curve track has eight vertices and six four-sided faces...
				//  the midpoints used in the mesh are omitted in the body
				var localBodyVertex0 = new CANNON.Vec3(), localBodyVertex1 = new CANNON.Vec3(), localBodyVertex2 = new CANNON.Vec3(), localBodyVertex3 = new CANNON.Vec3(), localBodyVertex4 = new CANNON.Vec3();
				var localBodyVertex5 = new CANNON.Vec3(), localBodyVertex6 = new CANNON.Vec3(), localBodyVertex7 = new CANNON.Vec3();
				localBodyVertex0.copy( localMeshVertex0 );
				// omit mesh vertex 1 = right top midpoint
				localBodyVertex1.copy( localMeshVertex2 );
				localBodyVertex2.copy( localMeshVertex3 );
				localBodyVertex3.copy( localMeshVertex4 );
				localBodyVertex4.copy( localMeshVertex5 );
				// omit mesh vertex 6 = right bottom midpoint
				localBodyVertex5.copy( localMeshVertex7 );
				localBodyVertex6.copy( localMeshVertex8 );
				localBodyVertex7.copy( localMeshVertex9 );
				var trackPieceBodyPoints = [
					localBodyVertex0,
					localBodyVertex1,
					localBodyVertex2,
					localBodyVertex3,
					localBodyVertex4,
					localBodyVertex5,
					localBodyVertex6,
					localBodyVertex7
					];
				var trackPieceBodyFaces = [
					[ 0, 3, 7, 4 ],
					[ 1, 5, 6, 2 ],
					[ 2, 6, 7, 3 ],
					[ 0, 4, 5, 1 ],
					[ 0, 1, 2, 3 ],
					[ 4, 7, 6, 5 ]
				];
				break;
			default:
				alert( "I should not be here ( copyPathElevationsToVertices()-switch-default )" );
				break;
		}
		trackPieceGeometry.computeBoundingSphere();
		trackPieceGeometry.computeFaceNormals();
		var trackPieceMesh = new THREE.Mesh( trackPieceGeometry, new THREE.MeshLambertMaterial( { color:rrTrackLayout[ 0 ].color } ) );
		trackPieceMesh.position.copy( rrTrackPieces[ currentPieceIndex ].center );
		scene.add( trackPieceMesh );
		rrTrackPieceMeshList.push( trackPieceMesh );
		trackBodyMaterial = new CANNON.Material( "trackBodyMaterial" );
		var trackPieceBody = new CANNON.Body( { material: trackBodyMaterial, mass: 0 } );
		var trackPieceBodyShape = new CANNON.ConvexPolyhedron( trackPieceBodyPoints, trackPieceBodyFaces );
		trackPieceBody.position.copy( rrTrackPieces[ currentPieceIndex ].center );
		trackPieceBodyShape.computeNormals();
		trackPieceBodyShape.updateBoundingSphereRadius();
		trackPieceBody.addShape( trackPieceBodyShape );
		world.add( trackPieceBody );
		rrTrackPieceBodyList.push( trackPieceBody );
	}
};

// Get the length of a section of track
function sectionLength( sectionIndex ) {
	switch( rrTrackLayout[ sectionIndex ].sectionType ) {
		case "straight":
			// For a straight section of track, the length is part of the section specification from the beginning
			return rrTrackLayout[ sectionIndex ].length;
			break;
		case "curveRight":
		case "curveLeft":
			// For a curved section of track, the length is the curve's radius times its angle
			return ( rrTrackLayout[ sectionIndex ].radius * ( rrTrackLayout[ sectionIndex ].degreeAngle * Math.PI / 180 ) );
			break;
		default:
			alert( "I should not be here ( sectionLength()-switch-default )" );
			break;
	}
};

// Get the length of a small piece of track
function smallPieceLength( pieceIndex ) {
	switch( rrTrackPieces[ pieceIndex ].pieceType ) {
		case "straight":
			return rrTrackPieces[ pieceIndex ].pieceLength;
			break;
		case "curveLeft":
		case "curveRight":
			return ( rrTrackPieces[ pieceIndex ].radius * rrTrackPieces[ pieceIndex ].radianAngle );
			break;
		default:
			alert( "I should not be here ( smallPieceLength()-switch-default )" );
			break;
	}
};

// Get the horizontal length of part of a section of track ("center gap") which extends
//	from the start point of a given starting small piece to the finish point of a given ending small piece
function iterationGapLength( startingPieceIndex, endingPieceIndex ) {
	var returnValue = 1;
	switch( rrTrackPieces[ startingPieceIndex ].pieceType ) {
		case "straight":
			var gapHorizontalLengthVector = new THREE.Vector3();
			var startPointHorizontalLocation = new THREE.Vector3();
			var endPointHorizontalLocation = new THREE.Vector3();
			// Get the endpoints of the gap's beginning-to-ending straight line
			startPointHorizontalLocation.copy( rrTrackPieces[ startingPieceIndex ].piecePathStartPoint );
			endPointHorizontalLocation.copy( rrTrackPieces[ endingPieceIndex ].piecePathFinishPoint );
			// Project those points onto the horizontal plane
			startPointHorizontalLocation.y = 0;
			endPointHorizontalLocation.y = 0;
			// Take the length of the vector connecting those two points
			gapHorizontalLengthVector.subVectors( endPointHorizontalLocation, startPointHorizontalLocation );
			returnValue = gapHorizontalLengthVector.length();
			break;
		case "curveLeft":
		case "curveRight":
			var curveRadius;
			var lastPieceLength, remainingPiecesLength;

			// Get the radius of the gap's curve
			curveRadius = rrTrackPieces[ startingPieceIndex ].radius;

			// var gapAngle, curveRadius;
			// var startingPieceStartingDirection = new THREE.Vector3();
			// var endingPieceEndingDirection = new THREE.Vector3();
			// // Get the directions of the gap's beginning and ending points
			// startingPieceStartingDirection.copy( rrTrackPieces[ startingPieceIndex ].piecePathStartDirection );
			// endingPieceEndingDirection.copy( rrTrackPieces[ endingPieceIndex ].piecePathFinishDirection );
			// // Project these directions onto the horizontal plane (probably unnecessary...)
			// gapAngle = startingPieceStartingDirection.angleTo( endingPieceEndingDirection );
			// returnValue = Math.abs( gapAngle * curveRadius );

			// Since the last piece in the gap might be a shorter-than-normal piece, figure its length individually
			lastPieceLength = rrTrackPieces[ endingPieceIndex ].radianAngle * curveRadius;
			remainingPiecesLength = rrTrackPieces[ startingPieceIndex ].radianAngle * curveRadius * ( endingPieceIndex - startingPieceIndex );
			returnValue = lastPieceLength + remainingPiecesLength;
			break;
		default:
			alert( "I should not be here ( iterationGapLength()-switch-default )" );
			break;
	}
	return returnValue;
};


