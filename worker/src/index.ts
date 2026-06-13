import { Hono } from "hono";
import { sessionMiddleware } from "./middleware/session";
import { myxlAuth } from "./routes/auth";
import { bookmark } from "./routes/bookmark";
import { dashboard } from "./routes/dashboard";
import { hot } from "./routes/hot";
import { packages } from "./routes/packages";
import { store } from "./routes/store";
import { webuiAuth } from "./routes/webui-auth";
import { htmlResponse, renderErrorPage } from "./ssr";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use("*", sessionMiddleware);

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "webui-xl",
    environment: c.env.ENVIRONMENT ?? "unknown",
  }),
);

app.route("/", webuiAuth);
app.route("/", myxlAuth);
app.route("/", dashboard);
app.route("/", packages);
app.route("/", store);
app.route("/", hot);
app.route("/", bookmark);

app.get("/demo/error", (c) => {
  const html = renderErrorPage(c.req.raw, {
    title: "Demo Error",
    message: "Ini halaman error contoh dari SSR engine.",
  });
  return htmlResponse(html);
});

app.notFound((c) => {
  const html = renderErrorPage(c.req.raw, {
    title: "404",
    message: `Path tidak ditemukan: ${c.req.path}`,
  });
  return htmlResponse(html, 404);
});

export default app;