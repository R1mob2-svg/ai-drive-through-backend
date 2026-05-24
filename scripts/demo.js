const http = require("http");
const { fork } = require("child_process");
const path = require("path");

console.log("=== STARTING DRIVETHRU SMART BACKEND API DEMO ===");

// 1. Start the API server in a child process
const serverPath = path.join(__dirname, "../src/server.js");
const serverProcess = fork(serverPath, [], {
  env: { ...process.env, PORT: "3002", PROVIDER_MODE: "MOCK" }
});

// Wait 1.5 seconds for the server to bind
setTimeout(() => {
  console.log("\nServer is active. Sending order simulation payload to /proof/simulate-order...");

  const postData = JSON.stringify({
    customerPayload: {
      customer_id: "cust_demo_777",
      customer_email: "demo.client@example.com",
      business_name: "Drive-Through Coffee Shop",
      business_phone: "+15559876543",
      product_id: "SMART_WEBSITE_PLUS_RECEPTIONIST"
    }
  });

  const options = {
    hostname: "localhost",
    port: 3002,
    path: "/proof/simulate-order",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let rawData = "";
    res.on("data", (chunk) => { rawData += chunk; });
    res.on("end", () => {
      try {
        const parsed = JSON.parse(rawData);
        console.log("\n=== RESPONSE RECEIVED FROM BACKEND API ===");
        console.log(`Status: ${parsed.status}`);
        console.log(`Task ID: ${parsed.task.task_id}`);
        console.log(`Fulfilment Status: ${parsed.summary.status}`);
        console.log(`AG Audit Handoff Result: ${parsed.auditReport.passed ? "PASSED" : "FAILED"}`);
        console.log("\nGenerated Receipts:");
        console.log(`- Verified Payment Receipt ID: ${parsed.summary.details[0] ? "rcpt_payment" : "n/a"}`);
        console.log(`- Alpha (Comms) Receipt: ${parsed.summary.details[0]?.receipt_type}`);
        console.log(`- Beta (Build) Receipt: ${parsed.summary.details[1]?.receipt_type}`);
        console.log(`- Gamma (Onboarding) Receipt: ${parsed.summary.details[2]?.receipt_type}`);
        console.log(`- Summary Receipt: ${parsed.summaryReceipt.receipt_id}`);
        console.log("\nSimulation ran completely in MOCK mode. Direct mutations avoided.");
      } catch (err) {
        console.error("Failed to parse response JSON:", err.message);
        console.log("Raw Response:", rawData);
      }
      
      // Clean up server
      serverProcess.kill();
      process.exit(0);
    });
  });

  req.on("error", (err) => {
    console.error("HTTP Request Error:", err.message);
    serverProcess.kill();
    process.exit(1);
  });

  req.write(postData);
  req.end();

}, 1500);
