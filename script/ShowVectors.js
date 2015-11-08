VisibleQuaternion = function( objectToShow, visibleSize ) {
	this.calculateAxesArray = function( objectToShow, visibleSize ) {
		var xVector = new THREE.Vector3( visibleSize, 0, 0 );
		var yVector = new THREE.Vector3( 0, visibleSize, 0 );
		var zVector = new THREE.Vector3( 0, 0, visibleSize );
		var xEndpoint = new THREE.Vector3();
		var yEndpoint = new THREE.Vector3();
		var zEndpoint = new THREE.Vector3();
		xVector.applyQuaternion( objectToShow.quaternion.normalize() );
		yVector.applyQuaternion( objectToShow.quaternion.normalize() );
		zVector.applyQuaternion( objectToShow.quaternion.normalize() );
		xEndpoint.addVectors( objectToShow.position, xVector );
		yEndpoint.addVectors( objectToShow.position, yVector );
		zEndpoint.addVectors( objectToShow.position, zVector );
		inst.vertices[ 0 ] = objectToShow.position.x;
		inst.vertices[ 1 ] = objectToShow.position.y;
		inst.vertices[ 2 ] = objectToShow.position.z;
		inst.vertices[ 3 ] = xEndpoint.x;
		inst.vertices[ 4 ] = xEndpoint.y;
		inst.vertices[ 5 ] = xEndpoint.z;
		inst.vertices[ 6 ] = objectToShow.position.x;
		inst.vertices[ 7 ] = objectToShow.position.y;
		inst.vertices[ 8 ] = objectToShow.position.z;
		inst.vertices[ 9 ] = yEndpoint.x;
		inst.vertices[ 10 ] = yEndpoint.y;
		inst.vertices[ 11 ] = yEndpoint.z;
		inst.vertices[ 12 ] = objectToShow.position.x;
		inst.vertices[ 13 ] = objectToShow.position.y;
		inst.vertices[ 14 ] = objectToShow.position.z;
		inst.vertices[ 15 ] = zEndpoint.x;
		inst.vertices[ 16 ] = zEndpoint.y;
		inst.vertices[ 17 ] = zEndpoint.z;
	}

	var inst = this;
	this.visibleSize = visibleSize;
	this.vertices = new Float32Array( 18 );
	this.colors = new Float32Array( [
		1, 1, 0,  1, 1, 0.6,
		0, 1, 1,  0.6, 1, 1,
		1, 0, 1,  1, 0.6, 1
		] );
	this.calculateAxesArray(objectToShow, visibleSize );
	this.geometry = new THREE.BufferGeometry();
	this.vertexArrayAttribute = new THREE.BufferAttribute( this.vertices, 3 );
	this.geometry.addAttribute( 'position', this.vertexArrayAttribute );
	this.geometry.addAttribute( 'color', new THREE.BufferAttribute( this.colors, 3 ) );
	this.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );
	THREE.Line.call( this, this.geometry, this.material, THREE.LinePieces );

	this.update = function( objectToShow ) {
		inst.calculateAxesArray( objectToShow, inst.visibleSize );
		inst.vertexArrayAttribute.needsUpdate = true;
	}
};
VisibleQuaternion.prototype = Object.create( THREE.Line.prototype );
VisibleQuaternion.prototype.constructor = VisibleQuaternion;

VisibleVector = function( vectorToShow, startPointVector, visibleSize, red, green, blue ) {
	this.calculateAxisArray = function( vectorToShow, startPointVector, visibleSize ) {
		var workingVector = new THREE.Vector3();
		var vectorEndpoint = new THREE.Vector3();
		workingVector.copy( vectorToShow );
		workingVector.normalize();
		workingVector.multiplyScalar( visibleSize );
		vectorEndpoint.addVectors( startPointVector, workingVector );
		inst.vertices[ 0 ] = startPointVector.x;
		inst.vertices[ 1 ] = startPointVector.y;
		inst.vertices[ 2 ] = startPointVector.z;
		inst.vertices[ 3 ] = vectorEndpoint.x;
		inst.vertices[ 4 ] = vectorEndpoint.y;
		inst.vertices[ 5 ] = vectorEndpoint.z;
	}

	var inst = this;
	this.startPointVector = startPointVector;
	this.visibleSize = visibleSize;
	this.vertices = new Float32Array( 6 );
	this.colors = new Float32Array( [
		0.5 * red, 0.4 * green, 0.3 * blue, red, green, blue
		] );
	this.calculateAxisArray(vectorToShow, startPointVector, visibleSize );
	this.geometry = new THREE.BufferGeometry();
	this.vertexArrayAttribute = new THREE.BufferAttribute( this.vertices, 3 );
	this.geometry.addAttribute( 'position', this.vertexArrayAttribute );
	this.geometry.addAttribute( 'color', new THREE.BufferAttribute( this.colors, 3 ) );
	this.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );
	THREE.Line.call( this, this.geometry, this.material, THREE.LinePieces );

	this.update = function( vectorToShow ) {
		inst.calculateAxisArray( vectorToShow, inst.startPointVector, inst.visibleSize );
		inst.vertexArrayAttribute.needsUpdate = true;
	}
};
VisibleVector.prototype = Object.create( THREE.Line.prototype );
VisibleVector.prototype.constructor = VisibleVector;
