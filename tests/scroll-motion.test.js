import assert from "node:assert/strict";
import test from "node:test";
import {
  headingFrame,
  scrollTension,
  surfaceFrame,
} from "../src/lib/scrollMotion.js";

test("scroll choreography retraces the same composition when scrolling back", () => {
  const positions = Array.from({ length: 101 }, (_, index) => index / 100);
  const forward = positions.map((position) =>
    surfaceFrame(position, "card", 1),
  );
  const reverse = [...positions]
    .reverse()
    .map((position) => surfaceFrame(position, "card", 1));
  assert.deepEqual(forward, reverse.reverse());
  assert.ok(forward[0].rotateX > 0);
  assert.ok(forward.at(-1).rotateX < 0);
  assert.notEqual(forward[0].light, forward.at(-1).light);
});

test("headlines and cards have a settled reading zone with no hidden content", () => {
  for (const position of [0.42, 0.5, 0.64]) {
    assert.equal(scrollTension(position), 0);
    assert.equal(headingFrame(position).fold, 0);
    assert.equal(surfaceFrame(position).scale, 1);
    assert.equal(surfaceFrame(position).rotateX, 0);
  }
  for (let index = 0; index <= 1000; index++) {
    const p = index / 1000;
    for (const kind of ["card", "photo", "copy", "form", "seal"]) {
      const frame = surfaceFrame(p, kind, index, index % 2 ? 20 : -20);
      assert.ok(frame.scale >= 0.965 && frame.scale <= 1);
      assert.ok(Math.abs(frame.rotateX) <= 6.85);
      assert.ok(frame.mediaScale >= 1.018 && frame.mediaScale <= 1.086);
      assert.ok(Object.values(frame).every(Number.isFinite));
    }
  }
});

test("momentum reverses gently and cannot overwhelm position-based motion", () => {
  const down = surfaceFrame(0.5, "card", 0, 1);
  const up = surfaceFrame(0.5, "card", 0, -1);
  assert.equal(down.rotateX, -up.rotateX);
  assert.equal(down.rotateY, -up.rotateY);
  assert.equal(down.scale, up.scale);
  assert.deepEqual(surfaceFrame(0.5, "card", 0, 100), down);
  assert.deepEqual(surfaceFrame(0.5, "card", 0, -100), up);
});

test("motion has no discontinuities during slow scroll or at the reading zone boundaries", () => {
  let previous = surfaceFrame(0);
  for (let index = 1; index <= 10000; index++) {
    const next = surfaceFrame(index / 10000);
    assert.ok(Math.abs(next.rotateX - previous.rotateX) < 0.003);
    assert.ok(Math.abs(next.scale - previous.scale) < 0.00003);
    previous = next;
  }
  assert.deepEqual(surfaceFrame(-1), surfaceFrame(0));
  assert.deepEqual(surfaceFrame(2), surfaceFrame(1));
});
