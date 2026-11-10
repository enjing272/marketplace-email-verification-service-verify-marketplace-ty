import { z } from "zod";

export const signupRequestSchema = z.discriminatedUnion("role", [
  z.object({
    signup_id: z.string().min(1).max(100),
    email: z.string().email(),
    role: z.literal("seller"),
    seller_asset_ids: z.array(z.string().min(1)).max(20),
    order_handoff_id: z.string().min(1).optional(),
  }).strict(),
  z.object({
    signup_id: z.string().min(1).max(100),
    email: z.string().email(),
    role: z.literal("buyer"),
    buyer_update_topics: z.array(z.string().min(1)).max(20),
    order_handoff_id: z.string().min(1).optional(),
  }).strict(),
]);

export type SignupRequest = z.infer<typeof signupRequestSchema>;

export type MarketplaceAccess = {
  seller_assets: "publish" | "blocked";
  buyer_updates: "subscribe" | "blocked";
  order_handoff: "release" | "blocked";
};

export function decideMarketplaceAccess(
  signup: SignupRequest,
  emailVerified: boolean,
): MarketplaceAccess {
  if (!emailVerified) {
    return { seller_assets: "blocked", buyer_updates: "blocked", order_handoff: "blocked" };
  }
  return {
    seller_assets: signup.role === "seller" ? "publish" : "blocked",
    buyer_updates: signup.role === "buyer" ? "subscribe" : "blocked",
    order_handoff: signup.order_handoff_id ? "release" : "blocked",
  };
}
