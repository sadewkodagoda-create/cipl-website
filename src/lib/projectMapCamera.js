import { PROJECT_LOCATIONS } from "./projectLocations.js";

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const smoothRange = (start, end, value) => {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

export function mercatorPoint(longitude, latitude) {
  const radians = (clamp(latitude, -85.05112878, 85.05112878) * Math.PI) / 180;
  return {
    x: (longitude + 180) / 360,
    y: (1 - Math.log(Math.tan(Math.PI / 4 + radians / 2)) / Math.PI) / 2,
  };
}

export function fitMapBounds(bounds, width, height, padding) {
  const [west, south, east, north] = bounds;
  const nw = mercatorPoint(west, north);
  const se = mercatorPoint(east, south);
  return {
    x: (nw.x + se.x) / 2,
    y: (nw.y + se.y) / 2,
    scale: Math.min(
      Math.max(1, width - 2 * padding.x) / (se.x - nw.x),
      Math.max(1, height - 2 * padding.y) / (se.y - nw.y),
    ),
  };
}

const PROJECT_BOUNDS = [
  Math.min(...PROJECT_LOCATIONS.map((project) => project.longitude)),
  Math.min(...PROJECT_LOCATIONS.map((project) => project.latitude)),
  Math.max(...PROJECT_LOCATIONS.map((project) => project.longitude)),
  Math.max(...PROJECT_LOCATIONS.map((project) => project.latitude)),
];

export function getProjectMapCamera(progress, width, height) {
  const island = fitMapBounds([79.4, 5.65, 82.08, 10.08], width, height, {
    x: Math.min(36, width * 0.07),
    y: Math.min(38, height * 0.07),
  });
  const western = fitMapBounds([79.65, 6.36, 80.55, 7.4], width, height, {
    x: 32,
    y: 36,
  });
  const projects = fitMapBounds(PROJECT_BOUNDS, width, height, {
    x: width < 600 ? 94 : Math.min(200, width * 0.24),
    y: Math.min(155, height * 0.29),
  });
  const firstLeg = progress < 0.55;
  const from = firstLeg ? island : western;
  const to = firstLeg ? western : projects;
  const t = firstLeg
    ? smoothRange(0.06, 0.55, progress)
    : smoothRange(0.55, 0.9, progress);
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    scale: 2 ** (Math.log2(from.scale) + Math.log2(to.scale / from.scale) * t),
  };
}

export function projectMapPoint(longitude, latitude, camera, width, height) {
  const point = mercatorPoint(longitude, latitude);
  return {
    x: width / 2 + (point.x - camera.x) * camera.scale,
    y: height / 2 + (point.y - camera.y) * camera.scale,
  };
}

// Callouts move apart while their geographic anchors stay on the supplied coordinates.
// Adjacent sites are less than 200 m apart; separating the logos avoids masking them.
export function getProjectMarker(project, camera, progress, width, height) {
  const anchor = projectMapPoint(
    project.longitude,
    project.latitude,
    camera,
    width,
    height,
  );
  const mobile = width < 600;
  const compact = height < 340;
  const spread = smoothRange(0.24, 0.9, progress);
  const initial = {
    tvs: [-68, -92],
    rocell: [72, -85],
    kap: [73, 4],
    "spa-ceylon": [-70, -7],
    "space-logistics": [-68, 76],
  };
  const final = mobile
    ? {
        tvs: [-108, -112],
        rocell: [37, -76],
        kap: [37, 74],
        "spa-ceylon": [-28, -70],
        "space-logistics": [-28, 51],
      }
    : {
        tvs: [-124, -102],
        rocell: [125, -27],
        kap: [125, 91],
        "spa-ceylon": [-125, -58],
        "space-logistics": [-125, 59],
      };
  const start = initial[project.id];
  const finish = final[project.id];
  const compactRatio = compact ? 0.57 : 1;
  const dx = (start[0] + (finish[0] - start[0]) * spread) * compactRatio;
  const dy = (start[1] + (finish[1] - start[1]) * spread) * compactRatio;
  const halfWidth = compact ? 50 : mobile ? 55 : 70;
  if (compact) {
    const lowerRow = height - 57;
    const compactLabels = {
      tvs: [width * 0.54, 48],
      rocell: [width * 0.83, Math.max(48, height * 0.33)],
      kap: [width * 0.83, lowerRow],
      "spa-ceylon": [width * 0.17, Math.max(48, lowerRow - 82)],
      "space-logistics": [width * 0.17, lowerRow],
    };
    const [targetX, targetY] = compactLabels[project.id];
    return {
      anchor,
      x: clamp(
        anchor.x + dx + (targetX - anchor.x - dx) * spread,
        halfWidth + 12,
        width - halfWidth - 12,
      ),
      y: clamp(
        anchor.y + dy + (targetY - anchor.y - dy) * spread,
        40,
        height - 53,
      ),
    };
  }
  return {
    anchor,
    x: clamp(anchor.x + dx, halfWidth + 12, width - halfWidth - 12),
    y: clamp(anchor.y + dy, compact ? 40 : 48, height - (compact ? 53 : 73)),
  };
}

export function projectMapStage(progress) {
  return progress < 0.3 ? 0 : progress < 0.76 ? 1 : 2;
}
