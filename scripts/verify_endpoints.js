const http = require("http");

function getEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          data: JSON.parse(data)
        });
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function verify() {
  try {
    const health = await getEndpoint("/health");
    console.log("HEALTH_CHECK_OK:", JSON.stringify(health.data));
    
    const catalog = await getEndpoint("/catalog");
    console.log("CATALOG_CHECK_OK: keys found:", Object.keys(catalog.data));
    
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err.message);
    process.exit(1);
  }
}

verify();
