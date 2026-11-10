import assert from "node:assert/strict";
import test from "node:test";
import { decideMarketplaceAccess, signupRequestSchema } from "../src/signup_policy.js";

test("seller assets and order handoff wait for verified email", () => {
  const seller = signupRequestSchema.parse({
    signup_id: "seller-42",
    email: "seller@example.test",
    role: "seller",
    seller_asset_ids: ["asset-phi-safe-guide"],
    order_handoff_id: "order-42",
  });

  assert.deepEqual(decideMarketplaceAccess(seller, false), {
    seller_assets: "blocked",
    buyer_updates: "blocked",
    order_handoff: "blocked",
  });
  assert.deepEqual(decideMarketplaceAccess(seller, true), {
    seller_assets: "publish",
    buyer_updates: "blocked",
    order_handoff: "release",
  });
});

test("verified buyer receives updates without seller publishing rights", () => {
  const buyer = signupRequestSchema.parse({
    signup_id: "buyer-17",
    email: "buyer@example.test",
    role: "buyer",
    buyer_update_topics: ["order-status"],
  });
  assert.deepEqual(decideMarketplaceAccess(buyer, true), {
    seller_assets: "blocked",
    buyer_updates: "subscribe",
    order_handoff: "blocked",
  });
});
