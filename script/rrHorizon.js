// rrHorizon.js - track generation routines

// The horizon is a large box with scenic walls which surrounds the track.
// The images to be used for the horizon walls are specified in each track layout's characteristics.
// The distance from the scene's global origin to the horizon walls is part of
//	the track layout's characteristics.
// The horizon needs to be deleted and rebuilt when a new track layout is put in
//	place so the horizon mesh is given a fixed ID so it can be removed from the
//	scene before a new horizon is added.

var horizonDistance;
var horizonGeometry, horizontMaterial, horizonMesh;
var horizonMaterialArray = [];

function installHorizon() {
	// Horizon mesh
	// ... the jpg images are "painted" on the OUTSIDE faces of the box so flip them right-left to view from the inside
	// ... with the camera on the +Z side of 0, 0, 0 (with the +X axis heading off to the right) looking through 0, 0, 0 the camera is looking at the "south" wall (face 6 in the loading order)
	// ...loading order for box faces is west, east, sky, ground, north, south
	horizonDistance = rrTrackLayout[ 0 ].horizonDistance;
	if( horizonMaterialArray.length > 0 ) {
		scene.remove( horizonMesh );
		horizonMaterialArray.length = 0;
	}

	var horizonWestImageFileName = rrTrackLayout[ 0 ].westImageFileName;
	var horizonEastImageFileName = rrTrackLayout[ 0 ].eastImageFileName;
	var horizonSkyImageFileName = rrTrackLayout[ 0 ].skyImageFileName;
	var horizonGroundImageFileName = rrTrackLayout[ 0 ].groundImageFileName;
	var horizonNorthImageFileName = rrTrackLayout[ 0 ].northImageFileName;
	var horizonSouthImageFileName = rrTrackLayout[ 0 ].southImageFileName;

	if( horizonWestImageFileName.charAt( 0 ) == "!" )
	{
		var faceColor = parseInt( horizonWestImageFileName.substring( 1 ), 16 );
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { color:faceColor, side:THREE.DoubleSide } ) );
	} else {
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'image/' + horizonWestImageFileName ), side:THREE.DoubleSide } ) );
	}
	if( horizonEastImageFileName.charAt( 0 ) == "!" )
	{
		var faceColor = parseInt( horizonEastImageFileName.substring( 1 ), 16 );
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { color:faceColor, side:THREE.DoubleSide } ) );
	} else {
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'image/' + horizonEastImageFileName ), side:THREE.DoubleSide } ) );
	}
	if( horizonSkyImageFileName.charAt( 0 ) == "!" )
	{
		var faceColor = parseInt( horizonSkyImageFileName.substring( 1 ), 16 );
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { color:faceColor, side:THREE.DoubleSide } ) );
	} else {
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'image/' + horizonSkyImageFileName ), side:THREE.DoubleSide } ) );
	}
	if( horizonGroundImageFileName.charAt( 0 ) == "!" )
	{
		var faceColor = parseInt( horizonGroundImageFileName.substring( 1 ), 16 );
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { color:faceColor, side:THREE.DoubleSide } ) );
	} else {
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'image/' + horizonGroundImageFileName ), side:THREE.DoubleSide } ) );
	}
	if( horizonNorthImageFileName.charAt( 0 ) == "!" )
	{
		var faceColor = parseInt( horizonNorthImageFileName.substring( 1 ), 16 );
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { color:faceColor, side:THREE.DoubleSide } ) );
	} else {
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'image/' + horizonNorthImageFileName ), side:THREE.DoubleSide } ) );
	}
	if( horizonSouthImageFileName.charAt( 0 ) == "!" )
	{
		var faceColor = parseInt( horizonSouthImageFileName.substring( 1 ), 16 );
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { color:faceColor, side:THREE.DoubleSide } ) );
	} else {
		horizonMaterialArray.push( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'image/' + horizonSouthImageFileName ), side:THREE.DoubleSide } ) );
	}
	horizonMaterial = new THREE.MeshFaceMaterial( horizonMaterialArray );
	horizonGeometry = new THREE.BoxGeometry( 2 * horizonDistance, 2 * horizonDistance, 2 * horizonDistance );
	horizonMesh = new THREE.Mesh( horizonGeometry, horizonMaterial );
	horizonMesh.position.set( 0, ( horizonDistance - rrTrackLayout[ 0 ].trackThickness ), 0 );
	scene.add( horizonMesh );
};
