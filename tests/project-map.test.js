import assert from "node:assert/strict";
import test from "node:test";
import {
  getProjectMapCamera,
  getProjectMarker,
  mercatorPoint,
  projectMapPoint,
} from "../src/lib/projectMapCamera.js";
import { PROJECT_LOCATIONS } from "../src/lib/projectLocations.js";
import { CLIENT_PROJECTS } from "../src/lib/clientProjects.js";

const VIEWPORTS = [
  { width: 343, height: 476, badgeWidth: 96, badgeHeight: 62 },
  { width: 398, height: 540, badgeWidth: 96, badgeHeight: 62 },
  { width: 736, height: 310, badgeWidth: 92, badgeHeight: 52 },
  { width: 736, height: 205, badgeWidth: 92, badgeHeight: 52 },
  { width: 736, height: 652, badgeWidth: 116, badgeHeight: 72 },
  { width: 1238, height: 652, badgeWidth: 116, badgeHeight: 72 },
];

test("map projection uses Web Mercator and retains each site's geographical position", () => {
  assert.deepEqual(mercatorPoint(0, 0), { x: 0.5, y: 0.5 });
  assert.ok(Math.abs(mercatorPoint(180, 0).x - 1) < 1e-12);
  assert.ok(Math.abs(mercatorPoint(0, 85.05112878).y) < 1e-9);
  const camera = getProjectMapCamera(1, 1238, 652);
  const points = PROJECT_LOCATIONS.map((project) =>
    projectMapPoint(project.longitude, project.latitude, camera, 1238, 652),
  );
  assert.ok(points[0].y < points[1].y && points[1].y < points[2].y);
  assert.ok(points[3].x < points[0].x && points[3].y > points[2].y);
  assert.ok(points[4].y > points[3].y);
  assert.ok(
    Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) < 10,
  );
});

test("the opening camera contains the whole island and scrolling zooms continuously", () => {
  for (const { width, height } of VIEWPORTS) {
    const start = getProjectMapCamera(0, width, height);
    for (const [longitude, latitude] of [
      [79.65, 5.92],
      [81.9, 9.83],
    ]) {
      const point = projectMapPoint(longitude, latitude, start, width, height);
      assert.ok(
        point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height,
      );
    }
    let previous = start.scale;
    for (let step = 1; step <= 100; step++) {
      const forward = getProjectMapCamera(step / 100, width, height);
      assert.ok(
        forward.scale >= previous - 1e-7,
        `Zoom reversed at step ${step} in ${width}px view`,
      );
      assert.ok(forward.scale / previous < 1.2, `Zoom jumped at step ${step}`);
      previous = forward.scale;
    }
    assert.ok(previous / start.scale > 5);
  }
});

test("all five final logo callouts fit and remain separate at supported screen sizes", () => {
  for (const { width, height, badgeWidth, badgeHeight } of VIEWPORTS) {
    const camera = getProjectMapCamera(1, width, height);
    const markers = PROJECT_LOCATIONS.map((project) =>
      getProjectMarker(project, camera, 1, width, height),
    );
    for (const marker of markers) {
      assert.ok(marker.anchor.x >= 0 && marker.anchor.x <= width);
      assert.ok(marker.anchor.y >= 0 && marker.anchor.y <= height);
      assert.ok(
        marker.x - badgeWidth / 2 >= 0 && marker.x + badgeWidth / 2 <= width,
      );
      assert.ok(
        marker.y - badgeHeight / 2 >= 0 &&
          marker.y + badgeHeight / 2 + 26 <= height,
      );
      for (const label of markers) {
        const anchorCovered =
          Math.abs(marker.anchor.x - label.x) < badgeWidth / 2 &&
          marker.anchor.y > label.y - badgeHeight / 2 &&
          marker.anchor.y < label.y + badgeHeight / 2 + 26;
        assert.ok(
          !anchorCovered,
          `A logo masks a geographic anchor in the ${width}px view`,
        );
      }
    }
    for (let first = 0; first < markers.length; first++) {
      for (let second = first + 1; second < markers.length; second++) {
        const a = markers[first];
        const b = markers[second];
        const separate =
          Math.abs(a.x - b.x) >= badgeWidth + 6 ||
          Math.abs(a.y - b.y) >= badgeHeight + 26;
        assert.ok(
          separate,
          `${PROJECT_LOCATIONS[first].name} overlaps ${PROJECT_LOCATIONS[second].name} in ${width}px view`,
        );
      }
    }
  }
});

test("every map logo opens its own gallery and KAP stays empty", () => {
  assert.equal(
    new Set(PROJECT_LOCATIONS.map((project) => project.galleryId)).size,
    5,
  );
  for (const project of PROJECT_LOCATIONS)
    assert.ok(CLIENT_PROJECTS[project.galleryId]);
  assert.equal(CLIENT_PROJECTS.kap.photos.length, 0);
});
