### Version 1
OK, we've got a very basic simple-oval, level track with some physics barriers to enclose it. A set of points defining a path along the center of the roadway, a "pace dog" point that runs at a constant speed along that path, a simple sphere for a "vehicle" and a spring between the pace dog and the sphere to drag it along.

In this version the track path is defined as two straight sections and two curve sections. This is the ultimately desired way to define a track so users may assemble sections of track in any way they like. We want to have (1) straight sections of X length and Y elevation change and (2) curved sections that have R radius, A angular extent and Y elevation change.

The angular extent refers to rotation about the positive Y axis (vertical "up") ~~so positive angles curve off to the left and negative angles curve off to the right.~~ The positive/negative angle method will become too confusing for lots of people so we'll have two kinds of curved track: "curving to the right" and "curving to the left".

"Straight" and "Curved" refer to 2 dimensional items in the X-Z (horizontal) plane and "elevation change" refers to a change in vertical location evenly distributed along the section of track. Elevation changes are smoothed by an iterative routine that inserts one degree changes of track slope near the ends of each section until adjacent sections meet with no more than a single degree of difference in slope. This eliminates the abrupt "bumps" that would otherwise be found where two different slopes meet.

A track layout consists of (1) two Vector3 objects to define an origin point and an initial direction (2) a list of sections. The first section begins at the origin point and starts off in the given initial direction. The end of that first section determines another point and then-current direction. The next section takes that second point and direction as its "origin" and the process repeats. If the collection of sections is properly selected, the end of the final section on the list will be at the track origin point and heading in the initial direction so the track is a continuous path.

For now we're ignoring the possibility of sloped curves or the like so the track is "flat" and level with the ground other than rising and falling in elevation.

The visible track in this version is made as in STL file in OpenScad and imported. The physics track-barriers are painstakingly added "by hand" to match the STL import.

We need to automate two track generation processes: (1) the Three.js mesh entities to make the track visible (to replace the laborious STL method) and (2) the Cannon.js entities to provide (a) the road surface, (b) the side barriers to keep a vehicle from falling off the track and (c) a "roof" over the track to keep vehicles from bouncing up and over the side barriers.

The code that takes a list of track sections and generates the track path creates a series of point along the center of each section's roadway. The number of points in each section is an arbitrary global variable currently set to 20.

For a straight section, the 20 pieces of roadway are simply rectangular blocks so we can just make so many Three.js and Cannon.js boxes to fit.

The width and thickness of the track are global constants and remain fixed throughout the track layout.

For a curved section, the pieces of roadway are essentially pie pieces with slightly smaller pie pieces subtracted. We need to further sub-divide each section piece into smaller slices that can be defined as triangular faces without losing too much of the roundness of the curve.

We need to choose appropriate units for physical sizes and distances. Cannon.js assumes the MKS ( meter kilogram second ) system while Three.js doesn't have any particular connection to physical units - just angles and relative units of any kind. For robot building, meters are too long. Centimeters maybe... Robot kit sources seem to give sizes in inches or millimeters so let's use millimeters for Three.js since that's better for knitting together with the meters in Cannon.js.

To be humane to users, we'll accept track dimensions in either inches or millimeters. To be humane to programmers, we'll convert user inch units into millimeters so that track geometries in code will always be in millimeters. This will necessitate track section lengths with fractional parts so that there won't be a noticable loss of geometric accuracy in the transition.

The track path definition will be made up of sections, straight and curved, and the path code geometry will consist of a series of points at one millimeter intervals along the length of the track. Given that track lengths can be specified in inches and curve extents are specified in degrees, there will be segments at the ends of sections which are less than one millimeter.

### Version 2
The rudimentary code to figure slope smoothing is done.
The rudimentary code to take a small piece of curve (to the right) defined by start point( x, z ), start direction( x, z ), subtended angle and radius and generate the THREE.js mesh and CANNON.js body for that piece is done.

Need to refine those routines into overall code to accept a list of track segments and generate lists of meshes and bodies to implement that track.

Then need to make a page which will facilitate creation of a list of track segments and show a preview of the resulting track.

Then need to implement database functions to save, edit and delete tracks. It would be nice if each track design had both a name AND a graphic snapshot.

### Version 3
OK, there's now a mostly stable set of things with four fixed track layouts and a simple blue ball being dragged along by a red "anchor" being animated along the layout's track path points.
Finally got the rendering and physics engines happy about vertices and faces by learning that neither one of them likes global coordinates for vertices - rather the vertex coordinates are relative to a center of each object and then the mesh and body "position" parameters are set to locate that center where it should be. Getting this fixed got rid of lots of complaints from Cannon.js about the face normals apparently pointing into the shapes...

Now we need to add a way for users to make their own track layouts. This will involve an additional screen (at least one), a way to choose colors and perhaps a way to upload image files and store and retrieve things to/from a server-side database.

