// Vercel Serverless Function entry point
const app = require("../backend/server");

module.exports = (req, res) => {
  // If the request was rewritten and stripped of /api prefix, restore it
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return app(req, res);
};
