// local.js — local development server runner only
// Do NOT use this in Vercel/serverless. Vercel uses api/index.js.
const app = require("./src/server");

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const mode = process.env.PROVIDER_MODE || "MOCK";
  console.log(`AI Drive-Through Backend running on http://localhost:${PORT} [${mode} mode]`);
  console.log(`  GET  /health`);
  console.log(`  GET  /catalog`);
  console.log(`  POST /proof/simulate-order`);
  console.log(`  GET  /tasks/:taskId`);
  console.log(`  GET  /receipts/task/:taskId`);
});
