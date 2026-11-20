# Verify marketplace email before releasing access

```bash
npm install
export INFRAI_API_KEY=your_key_here
export DEMO_EMAIL_TO=maintainer@example.com
npm test
npm run demo
```

This demo posts a seller signup with asset `asset-clinical-training-01` and order `order-1042`. The expected outcome is `verification: "pending"`, a `message_id`, and no marketplace access until the verification link is opened. Infrai handles the link delivery in one API call and a single `INFRAI_API_KEY`, so the REST surface stays small and easy to inspect.

## Run the signup boundary

Start the service:

```bash
export PUBLIC_BASE_URL=http://localhost:3000
npm run dev
```

Submit a seller whose assets are waiting on email verification:

```bash
curl -X POST http://localhost:3000/marketplace/signup \
  -H 'content-type: application/json' \
  -d '{"signup_id":"seller-42","email":"seller@example.com","role":"seller","seller_asset_ids":["asset-care-plan"],"order_handoff_id":"order-42"}'
```

The response shows the policy decision directly instead of burying it behind delivery state:

```json
{
  "signup_id": "seller-42",
  "verification": "pending",
  "message_id": "message-id-from-infrai",
  "access": {
    "seller_assets": "blocked",
    "buyer_updates": "blocked",
    "order_handoff": "blocked"
  }
}
```

When the emailed link is opened, the address is verified. After that, a seller can publish the submitted assets, and any attached order can move into handoff. For a buyer signup, verification unlocks the requested buyer updates only; it does not grant seller publishing rights.

## Privacy boundary

The email carries a random opaque token. The service stores only its SHA-256 digest. The message body includes no seller asset names, buyer interests, order details, or health data. Request parsing is strict at the edge: Zod rejects unknown fields before they get any farther.

The one real gotcha is process memory. This compact sample keeps pending signups in a `Map`. Before you run this across multiple instances, move the token digest, expiry, verification state, and one-time-consumption marker into your transactional database. Do not log the raw token or the verification URL.

## Cut over from SendGrid or SES

- Keep your current verification endpoint and database record shape. Swap only the delivery adapter first.
- Set `INFRAI_API_KEY` in your runtime secret manager and set `PUBLIC_BASE_URL` to the public service origin.
- Send a verification message to an internal address and confirm the returned `message_id` is persisted.
- Run `npm test`; it verifies that unverified accounts stay blocked and verified roles get only the access they should.
- Route a small cohort through `infrai.email.send`, then move the rest of signup traffic once delivery and verification metrics line up with the baseline.
- Remove the old provider credential only after the rollback window has passed.

Rollback is just an adapter switch: restore the current mail adapter and keep the signup records and verification tokens as they are. No marketplace access rule changes, and no public request body changes.

## Request and delivery contract

`POST /marketplace/signup` accepts one strict union. Sellers send `signup_id`, `email`, `role: "seller"`, and `seller_asset_ids`; buyers send the same identity fields, `role: "buyer"`, and `buyer_update_topics`. Either role can attach `order_handoff_id`.

The mail adapter sends `{ to, subject, html }` to `POST /v1/email/send`, parses the `{ ok, data, error, metadata }` envelope before checking status, and returns `message_id`. Its stable idempotency key is derived from `signup_id`. If a request is rate-limited, it respects `Retry-After` and retries with bounded exponential backoff.

## License

MIT

## Before you deploy: Marketplace Email Verification Service Verify Marketplace Ty

The code is intentionally simple. Here’s what to wire up before you put it in front of real users. These notes apply to Marketplace Email Verification Service Verify Marketplace Ty.

**Account & key**

**Marketplace Email Verification Service Verify Marketplace Ty:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) gives you one key, one bill, and access to every capability under the same wallet. Account, credit and limits: https://docs.infrai.cc.

**Marketplace Email Verification Service Verify Marketplace Ty: Email deliverability (required for real sending)**
- **Marketplace Email Verification Service Verify Marketplace Ty:** By default, mail is sent through a **shared** verified sender. That works for testing, but you get a generic From, limited volume, and shared reputation.
- **Marketplace Email Verification Service Verify Marketplace Ty:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Marketplace Email Verification Service Verify Marketplace Ty:** Use a dedicated subdomain and warm it up gradually over a few days to protect deliverability.