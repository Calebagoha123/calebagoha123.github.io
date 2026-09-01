import test from "node:test";
import assert from "node:assert/strict";

import { ratingLabel } from "../scripts/lib/rating-label.mjs";

test("rating labels always show five positions", () => {
  assert.equal(ratingLabel(), "☆☆☆☆☆");
  assert.equal(ratingLabel(3), "★★★☆☆");
  assert.equal(ratingLabel(3.5), "★★★½☆");
  assert.equal(ratingLabel(5), "★★★★★");
});
