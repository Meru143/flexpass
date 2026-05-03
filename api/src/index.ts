import { serve } from "@hono/node-server";
import { Hono } from "hono";

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

const port = Number(process.env.PORT ?? 4000);

serve({
  fetch: app.fetch,
  port,
});

export { app };
