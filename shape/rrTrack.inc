// In SCAD and Cannon.js, "North" = -Y, "South" = +Y, "West" = +X, "East" = -X, "Up" = +Z, "Down" = -Z
// In Three.js, "North" = +Z, "South" = -Z, "West" = +X, "East" = -X, "Up" = +Y, "Down" = -Y
// Track origin = 0, 0, 0 and is at the center of the oval
// "NorthDistance" is the distance from the origin to the north horizon wall (..., etc.)

trackNorthDistance = 2000;
trackSouthDistance = 2000;
trackWestDistance = 2500;
trackEastDistance = 2500;
trackSkyHeight = 2000;

trackEastCurveCenterX = -500;
trackWestCurveCenterX = 500;
trackInnerRadius = 500;
trackWidth = 200;
trackThickness = 30;
trackStraightStretchLength = ( trackWestCurveCenterX - trackEastCurveCenterX );
