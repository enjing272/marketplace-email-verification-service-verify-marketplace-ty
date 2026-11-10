import { signupRequestSchema } from "../src/signup_policy.js";
import { beginSignup } from "../src/verification_workflow.js";

const email = process.env.DEMO_EMAIL_TO;
if (!email) throw new Error("DEMO_EMAIL_TO is required");

const signup = signupRequestSchema.parse({
  signup_id: `seller-${Date.now()}`,
  email,
  role: "seller",
  seller_asset_ids: ["asset-clinical-training-01"],
  order_handoff_id: "order-1042",
});

console.log(await beginSignup(signup));
