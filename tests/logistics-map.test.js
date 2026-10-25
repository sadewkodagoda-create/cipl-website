import assert from "node:assert/strict";
import test from "node:test";
import {
  getLogisticsMapCamera,
  getLogisticsZoomRange,
  LOGISTICS_LOCATION,
  LOGISTICS_MAP_VIEWS,
  panLogisticsMap,
  zoomLogisticsMap,
} from "../src/lib/logisticsLocation.js";
import { projectMapPoint } from "../src/lib/projectMapCamera.js";

const SIZES = [
  [288, 370],
  [343, 370],
  [460, 365],
  [680, 460],
];

test("the supplied logistics location remains visible at every map preset and screen size", () => {
  for (const [width, height] of SIZES) {
    let previousScale = 0;
    for (const { id } of LOGISTICS_MAP_VIEWS) {
      const camera = getLogisticsMapCamera(id, width, height);
      const marker = projectMapPoint(
        LOGISTICS_LOCATION.longitude,
        LOGISTICS_LOCATION.latitude,
        camera,
        width,
        height,
      );
      assert.ok(
        marker.x >= 82 && marker.x <= width - 82,
        `${id}: logo fits horizontally`,
      );
      assert.ok(
        marker.y >= 140 && marker.y <= height - 30,
        `${id}: logo and geographic pin fit vertically`,
      );
      assert.ok(camera.scale > previousScale);
      previousScale = camera.scale;
    }
  }
});

test("zooming is bounded and keeps the geographic point under the cursor stationary", () => {
  for (const [width, height] of SIZES) {
    const camera = getLogisticsMapCamera("western", width, height);
    const range = getLogisticsZoomRange(width, height);
    const before = projectMapPoint(
      LOGISTICS_LOCATION.longitude,
      LOGISTICS_LOCATION.latitude,
      camera,
      width,
      height,
    );
    const zoomed = zoomLogisticsMap(camera, 1.6, width, height, before);
    const after = projectMapPoint(
      LOGISTICS_LOCATION.longitude,
      LOGISTICS_LOCATION.latitude,
      zoomed,
      width,
      height,
    );
    assert.ok(Math.abs(after.x - before.x) < 1e-7);
    assert.ok(Math.abs(after.y - before.y) < 1e-7);
    assert.equal(zoomLogisticsMap(camera, 1e8, width, height).scale, range.max);
    assert.equal(
      zoomLogisticsMap(camera, 1e-8, width, height).scale,
      range.min,
    );
  }
});

test("dragging pans by the requested screen distance and can be reversed without drift", () => {
  for (const [width, height] of SIZES) {
    const camera = getLogisticsMapCamera("western", width, height);
    const panned = panLogisticsMap(camera, 80, -45);
    const marker = (view) =>
      projectMapPoint(
        LOGISTICS_LOCATION.longitude,
        LOGISTICS_LOCATION.latitude,
        view,
        width,
        height,
      );
    assert.ok(Math.abs(marker(panned).x - marker(camera).x - 80) < 1e-7);
    assert.ok(Math.abs(marker(panned).y - marker(camera).y + 45) < 1e-7);
    const reset = panLogisticsMap(panned, -80, 45);
    assert.ok(Math.abs(reset.x - camera.x) < 1e-12);
    assert.ok(Math.abs(reset.y - camera.y) < 1e-12);
  }
});

test("the location stays in view through repeated button zooms in either direction", () => {
  for (const [width, height] of SIZES) {
    let camera = getLogisticsMapCamera("western", width, height);
    const point = (view) =>
      projectMapPoint(
        LOGISTICS_LOCATION.longitude,
        LOGISTICS_LOCATION.latitude,
        view,
        width,
        height,
      );
    const start = point(camera);
    for (const factor of [...Array(25).fill(1.6), ...Array(25).fill(1 / 1.6)]) {
      camera = zoomLogisticsMap(camera, factor, width, height);
      assert.ok(Math.abs(point(camera).x - start.x) < 1e-7);
      assert.ok(Math.abs(point(camera).y - start.y) < 1e-7);
    }
  }
});
