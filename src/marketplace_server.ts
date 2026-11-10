import { createServer, type ServerResponse } from "node:http";
import { ZodError, z } from "zod";
import { InfraiError } from "./infrai_email.js";
import { signupRequestSchema } from "./signup_policy.js";
import { beginSignup, verifySignup } from "./verification_workflow.js";

const verificationQuerySchema = z.object({ signup_id: z.string().min(1), token: z.string().min(1) });

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (request.method === "POST" && url.pathname === "/marketplace/signup") {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const signup = signupRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      return json(response, 202, await beginSignup(signup));
    }
    if (request.method === "GET" && url.pathname === "/marketplace/verify") {
      const query = verificationQuerySchema.parse(Object.fromEntries(url.searchParams));
      const result = verifySignup(query.signup_id, query.token);
      return result
        ? json(response, 200, result)
        : json(response, 400, { error: "Invalid verification request" });
    }
    return json(response, 404, { error: "Route not found" });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return json(response, 400, { error: "Invalid request body" });
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      return json(response, status, { error: error.code });
    }
    console.error(error);
    return json(response, 500, { error: "Internal service error" });
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Marketplace verification service listening on ${port}`));
