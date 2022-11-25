# TODO

* Ellipse math.
  * Mean anomaly - motion along path
  * Time offset.
* Planet orbit paths.
  * Elliptical
  * Transfer
* Helpers:
  * Ecliptic
  * Geocentric
* Planetary Day Length / Offset
* Jupiter
* Milky Way
* Axial Tilt (for planets other than earth)
* Saturn / Rings
* Jovian Moons
* Rocket Model (blender / GLTF)
* Local shadow lights
* Don't let camera be inside planets
* UI for selecting PoV / Focus object.
* Rocket Elliptical Orbits.
* Rocket transfer orbits.
* Planet positions.
* Time control UI.
* Earth specular map
* Earth bump map.
* Launch complices.
* Collisions
* Text annotations

# Notes

* Planet orbit paths: these are LoD'd based on camera distance from planet, they don't show
  when camera is too near the planet.

# Flight path types:

In order to maintain some degree of accuracy, we want to avoid cases where numerical stability
is an issue.

  * Elliptical:
    Rep 1:
      Velocity
      Position relative to center of mass
      Mass of primary.
    Rep 2:
      Center of ellipse.
      Major axis.
      Rotation around major axis.
  * Hyperbolic
  * Transfer - a FP between two masses, influenced by both.
    * Done using integration
