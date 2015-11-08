/*
	race track for robot race
	simple oval
	zero, zero, zero is the center of the left-hand semi-circular end and at the top of the track's thickness
	x +/- is right/left, y +/- is front/back, z +/- is up/down
	straight stretches run left-right
*/

include <rrTrack.inc>;

difference() {
	union() {
		// track outer edge left end
		translate( [ 0, 0, ( -trackThickness / 2 ) ] )
			cylinder( r = ( trackInnerRadius + trackWidth ), h = trackThickness, center = true, $fn = 100 );
		// track outer edge right end
		translate( [ trackStraightStretchLength, 0, ( -trackThickness / 2 ) ] )
			cylinder( r = ( trackInnerRadius + trackWidth ), h = trackThickness, center = true, $fn = 100 );
		// track outer edge straight region
		translate( [ ( trackStraightStretchLength / 2 ), 0, ( -trackThickness / 2 ) ] )
			cube( [ trackStraightStretchLength, ( 2 * ( trackInnerRadius + trackWidth ) ), trackThickness ], center = true );
	}
	// track inner edge left end
	translate( [ 0, 0, ( -trackThickness / 2 ) ] )
		cylinder( r = trackInnerRadius, h = trackThickness, center = true, $fn = 100 );
	// track inner edge right end
	translate( [ trackStraightStretchLength, 0, ( -trackThickness / 2 ) ] )
		cylinder( r = trackInnerRadius, h = trackThickness, center = true, $fn = 100 );
	// track inner edge straight region
	translate( [ ( trackStraightStretchLength / 2 ), 0, ( -trackThickness / 2 ) ] )
		cube( [ trackStraightStretchLength, ( 2 * trackInnerRadius ), trackThickness ], center = true );
}

// translate( [ , ,  ] )
// 	cube( [ , ,  ], center = true );
// translate( [ , ,  ] )
// 	cylinder( r = , h = , center = true, $fn = 200 );
