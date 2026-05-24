const { processVerifiedPaymentIntake } = require("../src/driveThrough/intake/verifiedPaymentIntake");
const { processLane } = require("../src/driveThrough/orchestration/laneModel");
const { compileFulfilmentSummary } = require("../src/driveThrough/orchestration/fulfilmentSummary");
const { generateReceipt } = require("../src/driveThrough/receipts/receiptWriter");
const { performAGAudit } = require("../src/driveThrough/audit/agAuditHandoff");
const { redactSensitiveData } = require("../src/driveThrough/schemas/customerPayload");

function runProofSimulation() {
  console.log("=== DRIVE-THRU SMART BACKEND V1 SIMULATION RUN ===\n");

  // Mock input data
  const stripeEvent = {
    id: "evt_live_45678",
    type: "checkout.session.completed",
    verification_status: "VERIFIED",
    data: {
      object: {
        payment_status: "paid",
        id: "cs_live_9999"
      }
    }
  };

  const customerPayload = {
    customer_id: "cust_rob_001",
    customer_email: "rob.drivethru@example.com",
    business_name: "Newton Burgers Ltd",
    business_phone: "+447700900077",
    product_id: "SMART_WEBSITE_PLUS_RECEPTIONIST", // Bundle product requiring all three lanes
    stripe_event_id: "evt_live_45678",
    stripe_checkout_session_id: "cs_live_9999"
  };

  console.log("1. Raw intake check...");
  console.log(`- Intake payload: Email: ${customerPayload.customer_email}, Product: ${customerPayload.product_id}`);
  
  const intakeResult = processVerifiedPaymentIntake(stripeEvent, customerPayload);
  if (intakeResult.status !== "DRIVE_THROUGH_FULFILL") {
    console.error(`- Intake Rejected: ${intakeResult.status}`, intakeResult.errors);
    process.exit(1);
  }
  console.log("-> SUCCESS: Verified Stripe payment accepted. Task created.\n");

  const task = intakeResult.task;
  console.log("2. Created Fulfilment Task metadata:");
  console.log(`- Task ID: ${task.task_id}`);
  console.log(`- Template: ${task.fulfilment_template_id}`);
  console.log(`- Created at: ${task.created_at}`);
  console.log(`- Initial Status: ${task.status}\n`);

  console.log("3. Processing parallel fulfilment lanes (simulated mode)...");
  
  // Simulate executing lane actions safely
  const alphaResult = processLane("alpha_voice_comms", "PROVISION_TWILIO_NUMBER", task.lanes.alpha_voice_comms.lane_input);
  console.log(`- Alpha Lane (Comms): Success=${alphaResult.success}, Action=${alphaResult.action}`);

  const betaResult = processLane("beta_build_deploy", "GENERATE_VITE_SCAFFOLD", task.lanes.beta_build_deploy.lane_input);
  console.log(`- Beta Lane (Build): Success=${betaResult.success}, Action=${betaResult.action}`);

  const gammaResult = processLane("gamma_dashboard_onboarding", "MOCK_GOOGLE_SHEET_ROW", task.lanes.gamma_dashboard_onboarding.lane_input);
  console.log(`- Gamma Lane (Onboarding): Success=${gammaResult.success}, Action=${gammaResult.action}\n`);

  console.log("4. Generating receipts...");
  
  const paymentReceipt = generateReceipt("VERIFIED_PAYMENT_RECEIPT", {
    event_id: stripeEvent.id,
    session_id: stripeEvent.data.object.id,
    customer_email: redactSensitiveData(customerPayload).customer_email,
    amount_paid: 129900,
    verified_at: new Date().toISOString()
  });
  console.log(`- Created Verified Payment Receipt: ${paymentReceipt.receipt_id} (Signed: ${paymentReceipt.cryptographic_signature})`);

  const taskReceipt = generateReceipt("DRIVE_THROUGH_TASK_CREATED_RECEIPT", {
    task_id: task.task_id,
    customer_ref: task.customer_ref,
    product_id: task.product_id,
    template_id: task.fulfilment_template_id,
    created_at: task.created_at
  });
  console.log(`- Created Task Creation Receipt: ${taskReceipt.receipt_id} (Signed: ${taskReceipt.cryptographic_signature})`);

  const alphaReceipt = generateReceipt("ALPHA_VOICE_COMMS_RECEIPT", {
    task_id: task.task_id,
    provisioned_number: alphaResult.details.provisioned_number,
    status: "PROVISIONED",
    timestamp: alphaResult.timestamp
  });
  console.log(`- Created Alpha Receipt: ${alphaReceipt.receipt_id}`);

  const betaReceipt = generateReceipt("BETA_BUILD_DEPLOY_RECEIPT", {
    task_id: task.task_id,
    github_repo: task.lanes.beta_build_deploy.lane_input.repo_name,
    build_status: "SUCCESS",
    timestamp: betaResult.timestamp
  });
  console.log(`- Created Beta Receipt: ${betaReceipt.receipt_id}`);

  const gammaReceipt = generateReceipt("GAMMA_DASHBOARD_ONBOARDING_RECEIPT", {
    task_id: task.task_id,
    sheet_row_added: gammaResult.details.row_index,
    welcome_email_drafted: true,
    timestamp: gammaResult.timestamp
  });
  console.log(`- Created Gamma Receipt: ${gammaReceipt.receipt_id}\n`);

  console.log("5. Aggregating summary...");
  const compiledReceipts = [
    { lane_name: "alpha_voice_comms", success: alphaResult.success, receipt_type: alphaReceipt.receipt_type },
    { lane_name: "beta_build_deploy", success: betaResult.success, receipt_type: betaReceipt.receipt_type },
    { lane_name: "gamma_dashboard_onboarding", success: gammaResult.success, receipt_type: gammaReceipt.receipt_type }
  ];

  const summary = compileFulfilmentSummary(task, compiledReceipts);
  const summaryReceipt = generateReceipt("DRIVE_THROUGH_FULFILMENT_SUMMARY_RECEIPT", {
    summary_id: summary.summary_id,
    task_id: summary.task_id,
    status: summary.status,
    collected_receipts: summary.receipts_collected.join(", "),
    completed_at: summary.timestamp
  });
  console.log(`- Compilation Status: ${summary.status}`);
  console.log(`- Summary Receipt ID: ${summaryReceipt.receipt_id} (Signed: ${summaryReceipt.cryptographic_signature})\n`);

  console.log("6. Dispatching AG Audit Lane...");
  const auditReceipts = [
    { lane_name: "alpha_voice_comms", success: alphaResult.success, receipt_type: alphaReceipt.receipt_type },
    { lane_name: "beta_build_deploy", success: betaResult.success, receipt_type: betaReceipt.receipt_type },
    { lane_name: "gamma_dashboard_onboarding", success: gammaResult.success, receipt_type: gammaReceipt.receipt_type }
  ];
  
  const auditReport = performAGAudit(task, stripeEvent, auditReceipts);
  console.log(`- AG Audit Status: ${auditReport.passed ? "PASSED" : "FAILED"}`);
  if (!auditReport.passed) {
    console.error("- Audit Failures:", auditReport.failures);
  } else {
    console.log("- Audit confirmed: No secrets leaked, payment source verified, security boundary fully observed.");
  }
  console.log("");

  console.log("=== SIMULATION SUMMARY ===");
  console.log("Status: READY_FOR_AG_AUDIT");
}

if (require.main === module) {
  runProofSimulation();
}
