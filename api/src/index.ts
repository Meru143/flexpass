import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { membershipRoutes } from "./routes/membership";

const app = new Hono();

app.get("/health", (c) =>
  c.json({
    data: {
      status: "ok",
      service: "flexpass-api",
    },
    error: null,
  }),
);

app.route("/api/membership", membershipRoutes);

const port = Number(process.env.PORT ?? 4000);

serve({
  fetch: app.fetch,
  port,
});

export { app };
