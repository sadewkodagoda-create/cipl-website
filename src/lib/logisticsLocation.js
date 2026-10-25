import { clamp, fitMapBounds, projectMapPoint } from "./projectMapCamera.js";

// Coordinates and street address resolved from the supplied Google Maps link.
export const LOGISTICS_LOCATION = {
  latitude: 6.702515,
  longitude: 79.9681847,
  address: "No. 484/A, Horana Road",
  locality: "Bandaragama, Sri Lanka",
  mapsUrl: "https://maps.app.goo.gl/8MeTo6XzwCvYK5aKA?g_st=ac",
  email: "Info@cipl.lk",
  phone: "070 581 2293",
  phoneHref: "tel:+94705812293",
};

export const LOGISTICS_MAP_VIEWS = [
  { id: "island", label: "Sri Lanka", bounds: [79.4, 5.65, 82.08, 10.08] },
  {
    id: "western",
    label: "Western Province",
    bounds: [79.55, 6.2, 80.65, 7.4],
  },
  {
    id: "location",
    label: "Our location",
    bounds: [79.9181847, 6.667515, 80.0181847, 6.737515],
  },
];

export function getLogisticsMapCamera(view, width, height) {
  const { bounds } = LOGISTICS_MAP_VIEWS.find((item) => item.id === view);
  return fitMapBounds(bounds, width, height, {
    x: Math.min(36, width * 0.08),
    y: Math.min(42, height * 0.1),
  });
}

export function getLogisticsZoomRange(width, height) {
  return {
    min: getLogisticsMapCamera("island", width, height).scale,
    max: getLogisticsMapCamera("location", width, height).scale * 2,
  };
}

export function zoomLogisticsMap(camera, factor, width, height, anchor) {
  const range = getLogisticsZoomRange(width, height);
  const scale = clamp(camera.scale * factor, range.min, range.max);
  const focalPoint =
    anchor ??
    projectMapPoint(
      LOGISTICS_LOCATION.longitude,
      LOGISTICS_LOCATION.latitude,
      camera,
      width,
      height,
    );
  const x = focalPoint.x - width / 2;
  const y = focalPoint.y - height / 2;
  return {
    x: camera.x + x * (1 / camera.scale - 1 / scale),
    y: camera.y + y * (1 / camera.scale - 1 / scale),
    scale,
  };
}

export function panLogisticsMap(camera, deltaX, deltaY) {
  return {
    ...camera,
    x: camera.x - deltaX / camera.scale,
    y: camera.y - deltaY / camera.scale,
  };
}
