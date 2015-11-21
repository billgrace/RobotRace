# RobotRace
## For building virtual robots and trying them out.

### Version 1
OK, we've got a very basic simple-oval, level track with some physics barriers to enclose it. A set of points defining a path along the center of the roadway, a "pace dog" point that runs at a constant speed along that path, a simple sphere for a "vehicle" and a spring between the pace dog and the sphere to drag it along.

In this version the track path is defined as two straight sections and two curve sections. This is the ultimately desired way to define a track so users may assemble sections of track in any way they like. We want to have (1) straight sections of X length and Y elevation change and (2) curved sections that have R radius, A angular extent and Y elevation change. The angular extent refers to rotation about the positive Y axis (vertical "up") so positive angles curve off to the left and negative angles curve off to the right. "Straight" and "Curved" refer to 2 dimensional items in the X-Z (horizontal) plane and "elevation change" refers to a change in vertical location evenly distributed along the section of track.

For now we're ignoring the possibility of sloped curves or the like so the track is "flat" and level with the ground other than rising and falling in elevation.

The visible track in this version is made as in STL file in OpenScad and imported. The physics track-barriers are painstakingly added "by hand" to match the STL import.

We need to automate two track generation processes: (1) the Three.js mesh entities to make the track visible (to replace the laborious STL method) and (2) the Cannon.js entities to provide (a) the road surface, (b) the side barriers to keep a vehicle from falling off the track and (c) a "roof" over the track to keep vehicles from bouncing up and over the side barriers.

The code that takes a list of track sections and generates the track path creates a series of point along the center of each section's roadway. The number of points in each section is an arbitrary global variable currently set to 20.

For a straight section, the 20 pieces of roadway are simply rectangular blocks so we can just make so many Three.js and Cannon.js boxes to fit.

For a curved section, the pieces or roadway are essentially pie pieces with slightly smaller pie pieces subtracted. We need to further sub-divide each section piece into smaller slices that can be defined as triangular faces without losing too much of the roundness of the curve.