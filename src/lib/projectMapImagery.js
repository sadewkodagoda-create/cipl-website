import ocean from "../assets/project-map/ocean.webp";
import island from "../assets/project-map/island.webp";
import western from "../assets/project-map/western.webp";
import district from "../assets/project-map/district.webp";
import projects from "../assets/project-map/projects.webp";

// EOxCloudless 2016 imagery, CC BY 4.0. See the asset README for source details.
// Bounds are W/S/E/N in WGS84; images were exported in Web Mercator (EPSG:3857).
export const PROJECT_MAP_IMAGERY = [
  { src: ocean, bounds: [72, 3, 90, 12.5], reveal: 0 },
  { src: island, bounds: [76.8, 4.6, 84.9, 11.6], reveal: 0 },
  { src: western, bounds: [79.2, 5.9, 81.1, 8], reveal: 0.22 },
  { src: district, bounds: [79.65, 6.35, 80.5, 7.2], reveal: 0.48 },
  { src: projects, bounds: [79.8, 6.51, 80.3, 6.9], reveal: 0.7 },
];
