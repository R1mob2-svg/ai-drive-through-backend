const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(collectionName) {
  return path.join(DATA_DIR, `${collectionName}.json`);
}

function readData(collectionName) {
  ensureDataDir();
  const filePath = getFilePath(collectionName);
  if (!fs.existsSync(filePath)) {
    writeData(collectionName, collectionName === "catalog" ? {} : []);
    return collectionName === "catalog" ? {} : [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return collectionName === "catalog" ? {} : [];
  }
}

function writeData(collectionName, data) {
  ensureDataDir();
  const filePath = getFilePath(collectionName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
  readData,
  writeData
};
