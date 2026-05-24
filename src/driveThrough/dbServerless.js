/**
 * dbServerless.js
 * Dual-mode storage: in-memory for serverless (Vercel), file-based for local dev.
 * PROVIDER_MODE must remain MOCK/TEST — no live mutations.
 */

const IS_SERVERLESS = process.env.VERCEL === "1" || process.env.NODE_ENV === "serverless";

// ─── IN-MEMORY STORE ─────────────────────────────────────────────
const memoryStore = {
  tasks: [],
  receipts: [],
  events: [],
};

// ─── FILE-BASED STORE (local dev only) ───────────────────────────
let fs, path, DATA_DIR;

if (!IS_SERVERLESS) {
  try {
    fs = require("fs");
    path = require("path");
    DATA_DIR = path.join(__dirname, "../../data");
  } catch (e) {
    // silently fall back to memory if fs unavailable
  }
}

function ensureDataDir() {
  if (!IS_SERVERLESS && fs && DATA_DIR && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(collectionName) {
  return path.join(DATA_DIR, `${collectionName}.json`);
}

function readData(collectionName) {
  // Serverless: always use in-memory
  if (IS_SERVERLESS || !fs) {
    return collectionName === "catalog"
      ? memoryStore[collectionName] || {}
      : memoryStore[collectionName] || [];
  }

  // Local: use file storage
  ensureDataDir();
  const filePath = getFilePath(collectionName);
  if (!fs.existsSync(filePath)) {
    const empty = collectionName === "catalog" ? {} : [];
    writeData(collectionName, empty);
    return empty;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return collectionName === "catalog" ? {} : [];
  }
}

function writeData(collectionName, data) {
  // Serverless: write to in-memory only
  if (IS_SERVERLESS || !fs) {
    memoryStore[collectionName] = data;
    return;
  }

  // Local: write to file
  ensureDataDir();
  const filePath = getFilePath(collectionName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = { readData, writeData };
