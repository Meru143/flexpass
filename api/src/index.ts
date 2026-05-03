import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { gymRoutes } from "./routes/gym";
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
app.route("/api/gym", gymRoutes);

const port = Number(process.env.PORT ?? 4000);

serve({
  fetch: app.fetch,
  port,
});

export { app };
