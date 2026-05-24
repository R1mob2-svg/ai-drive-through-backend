// api/index.js — Vercel serverless entry point
// Imports the Express app and exports it as the serverless handler.
// No app.listen() here — Vercel manages the server lifecycle.
const app = require("../src/server");

module.exports = app;
