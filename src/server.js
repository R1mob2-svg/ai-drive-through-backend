require("dotenv").config();
const express = require("express");
const { PRODUCTS } = require("./driveThrough/catalog/products");
const { processVerifiedPaymentIntake } = require("./driveThrough/intake/verifiedPaymentIntake");
const { executeTaskQueue } = require("./driveThrough/orchestration/queueRunner");
const { performAGAudit } = require("./driveThrough/audit/agAuditHandoff");
const { generateReceipt } = require("./driveThrough/receipts/receiptWriter");
const { redactSensitiveData } = require("./driveThrough/schemas/customerPayload");
const { readData, writeData } = require("./driveThrough/db");

const app = express();
const PORT = process.env.PORT || 3001;
const MODE = process.env.PROVIDER_MODE || "MOCK"; // Options: MOCK, TEST, LIVE_BLOCKED

app.use(express.json());

// Manual CORS middleware to avoid extra package dependencies
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// GET /health
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode: MODE,
    timestamp: new Date().toISOString()
  });
});

// GET /catalog
app.get("/catalog", (req, res) => {
  res.json(PRODUCTS);
});

// POST /intake/verified-payment
app.post("/intake/verified-payment", async (req, res) => {
  const { stripeEvent, customerPayload } = req.body;

  if (!stripeEvent || !customerPayload) {
    return res.status(400).json({ error: "Missing stripeEvent or customerPayload in request body" });
  }

  // Log Stripe event in database
  const events = readData("events");
  events.push({
    event_id: stripeEvent.id,
    received_at: new Date().toISOString(),
    event_type: stripeEvent.type
  });
  writeData("events", events);

  // Process payment intake
  const intakeResult = processVerifiedPaymentIntake(stripeEvent, customerPayload);
  if (intakeResult.status !== "DRIVE_THROUGH_FULFILL") {
    return res.status(400).json(intakeResult);
  }

  const task = intakeResult.task;
  
  // Write initial receipts
  const paymentReceipt = generateReceipt("VERIFIED_PAYMENT_RECEIPT", {
    event_id: stripeEvent.id,
    session_id: stripeEvent.data?.object?.id || "unknown",
    customer_email: redactSensitiveData(customerPayload).customer_email,
    amount_paid: PRODUCTS[customerPayload.product_id]?.setup_fee || 0,
    verified_at: new Date().toISOString()
  });
  
  const taskReceipt = generateReceipt("DRIVE_THROUGH_TASK_CREATED_RECEIPT", {
    task_id: task.task_id,
    customer_ref: task.customer_ref,
    product_id: task.product_id,
    template_id: task.fulfilment_template_id,
    created_at: task.created_at
  });

  const receipts = readData("receipts");
  receipts.push(paymentReceipt, taskReceipt);
  writeData("receipts", receipts);

  // Save initial queued task
  const tasks = readData("tasks");
  tasks.push(task);
  writeData("tasks", tasks);

  // Run execution queue asynchronously
  executeTaskQueue(task, stripeEvent, MODE)
    .then(runResult => {
      console.log(`Fulfilment Queue run completed for task: ${task.task_id}`);
    })
    .catch(err => {
      console.error(`Fulfilment Queue execution failed for task ${task.task_id}: ${err.message}`);
    });

  res.status(201).json({
    status: "ACCEPTED",
    task_id: task.task_id,
    payment_receipt_id: paymentReceipt.receipt_id,
    task_receipt_id: taskReceipt.receipt_id
  });
});

// GET /tasks/:taskId
app.get("/tasks/:taskId", (req, res) => {
  const tasks = readData("tasks");
  const task = tasks.find(t => t.task_id === req.params.taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json(task);
});

// GET /receipts/:receiptId
app.get("/receipts/:receiptId", (req, res) => {
  const receipts = readData("receipts");
  const receipt = receipts.find(r => r.receipt_id === req.params.receiptId);
  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }
  res.json(receipt);
});

// GET /receipts/task/:taskId (helper route to fetch receipts for a task)
app.get("/receipts/task/:taskId", (req, res) => {
  const receipts = readData("receipts");
  const taskReceipts = receipts.filter(r => {
    return r.payload.task_id === req.params.taskId || (r.payload.task_id && r.payload.task_id === req.params.taskId);
  });
  res.json(taskReceipts);
});

// POST /proof/simulate-order
app.post("/proof/simulate-order", async (req, res) => {
  const { customerPayload } = req.body;
  if (!customerPayload) {
    return res.status(400).json({ error: "Missing customerPayload" });
  }

  const stripeEventId = "evt_test_" + Math.random().toString(36).substr(2, 9);
  const stripeSessionId = "cs_test_" + Math.random().toString(36).substr(2, 9);

  if (!customerPayload.stripe_event_id) {
    customerPayload.stripe_event_id = stripeEventId;
  }
  if (!customerPayload.stripe_checkout_session_id) {
    customerPayload.stripe_checkout_session_id = stripeSessionId;
  }
  if (!customerPayload.customer_id) {
    customerPayload.customer_id = "cust_sim_" + Math.random().toString(36).substr(2, 9);
  }

  const stripeEvent = {
    id: stripeEventId,
    type: "checkout.session.completed",
    verification_status: "VERIFIED",
    data: {
      object: {
        payment_status: "paid",
        id: stripeSessionId
      }
    }
  };

  const intakeResult = processVerifiedPaymentIntake(stripeEvent, customerPayload);
  if (intakeResult.status !== "DRIVE_THROUGH_FULFILL") {
    return res.status(400).json(intakeResult);
  }

  const task = intakeResult.task;
  const paymentReceipt = generateReceipt("VERIFIED_PAYMENT_RECEIPT", {
    event_id: stripeEvent.id,
    session_id: stripeEvent.data.object.id,
    customer_email: redactSensitiveData(customerPayload).customer_email,
    amount_paid: PRODUCTS[customerPayload.product_id]?.setup_fee || 0,
    verified_at: new Date().toISOString()
  });

  const taskReceipt = generateReceipt("DRIVE_THROUGH_TASK_CREATED_RECEIPT", {
    task_id: task.task_id,
    customer_ref: task.customer_ref,
    product_id: task.product_id,
    template_id: task.fulfilment_template_id,
    created_at: task.created_at
  });

  const receipts = readData("receipts");
  receipts.push(paymentReceipt, taskReceipt);
  writeData("receipts", receipts);

  const tasks = readData("tasks");
  tasks.push(task);
  writeData("tasks", tasks);

  try {
    const queueResults = await executeTaskQueue(task, stripeEvent, MODE);
    res.json({
      status: "SUCCESS",
      task: queueResults.task,
      summary: queueResults.summary,
      summaryReceipt: queueResults.summaryReceipt,
      auditReport: queueResults.auditReport
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI Drive-Through Smart Backend listening on port ${PORT} in ${MODE} mode`);
});
