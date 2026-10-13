export default async function handler(req, res) {
  try {
    const mod = await import("./dist/app.js");
    const app = mod.default || mod.app || mod;
    return app(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "STARTUP_ERROR",
        message: err?.message,
        stack: err?.stack,
      })
    );
  }
}
