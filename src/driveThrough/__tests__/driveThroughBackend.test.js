const assert = require("assert");
const { processVerifiedPaymentIntake } = require("../intake/verifiedPaymentIntake");
const { processLane } = require("../orchestration/laneModel");
const { generateReceipt } = require("../receipts/receiptWriter");
const { performAGAudit } = require("../audit/agAuditHandoff");
const { generateRepairDraft } = require("../repair/repairDraft");
const { redactSensitiveData } = require("../schemas/customerPayload");

function runAllTests() {
  console.log("Starting DriveThru Smart Backend V1 Unit Tests...\n");

  // 1. Valid verified payment creates task
  console.log("Test 1: Valid verified payment creates task...");
  const mockStripeEvent = {
    id: "evt_12345",
    type: "checkout.session.completed",
    verification_status: "VERIFIED",
    data: {
      object: {
        payment_status: "paid",
        id: "cs_98765"
      }
    }
  };
  const mockCustomerPayload = {
    customer_id: "cust_abc",
    customer_email: "test@example.com",
    business_name: "Joy Through Coffee",
    business_phone: "+15551234567",
    product_id: "AI_RECEPTIONIST",
    stripe_event_id: "evt_12345",
    stripe_checkout_session_id: "cs_98765"
  };

  const result = processVerifiedPaymentIntake(mockStripeEvent, mockCustomerPayload);
  assert.strictEqual(result.status, "DRIVE_THROUGH_FULFILL");
  assert.strictEqual(result.task.product_id, "AI_RECEPTIONIST");
  assert.strictEqual(result.task.status, "QUEUED");
  console.log("-> PASS");

  // 2. Untrusted payment is rejected
  console.log("Test 2: Untrusted payment is rejected...");
  const untrustedStripeEvent = {
    ...mockStripeEvent,
    verification_status: "UNTRUSTED"
  };
  const resultUntrusted = processVerifiedPaymentIntake(untrustedStripeEvent, mockCustomerPayload);
  assert.strictEqual(resultUntrusted.status, "EVENT_REJECTED_UNTRUSTED");
  console.log("-> PASS");

  // 3. Unknown product rejected
  console.log("Test 3: Unknown product rejected...");
  const badProductPayload = {
    ...mockCustomerPayload,
    product_id: "NON_EXISTENT_PROD"
  };
  const resultBadProduct = processVerifiedPaymentIntake(mockStripeEvent, badProductPayload);
  assert.strictEqual(resultBadProduct.status, "PAYLOAD_INVALID");
  assert(resultBadProduct.errors.some(err => err.includes("Unknown product_id")));
  console.log("-> PASS");

  // 4. Missing customer email rejected
  console.log("Test 4: Missing customer email rejected...");
  const badEmailPayload = {
    ...mockCustomerPayload,
    customer_email: ""
  };
  const resultBadEmail = processVerifiedPaymentIntake(mockStripeEvent, badEmailPayload);
  assert.strictEqual(resultBadEmail.status, "PAYLOAD_INVALID");
  assert(resultBadEmail.errors.some(err => err.includes("Missing customer_email")));
  console.log("-> PASS");

  // 5. Lane model creates 3 lanes
  console.log("Test 5: Lane model structures 3 lanes...");
  assert(result.task.lanes.alpha_voice_comms);
  assert(result.task.lanes.beta_build_deploy);
  assert(result.task.lanes.gamma_dashboard_onboarding);
  console.log("-> PASS");

  // 6. Receipts are created
  console.log("Test 6: Receipts are generated properly...");
  const receipt = generateReceipt("ALPHA_VOICE_COMMS_RECEIPT", {
    task_id: result.task.task_id,
    provisioned_number: "+15550199",
    status: "COMPLETED",
    timestamp: new Date().toISOString()
  });
  assert.strictEqual(receipt.receipt_type, "ALPHA_VOICE_COMMS_RECEIPT");
  assert(receipt.cryptographic_signature);
  console.log("-> PASS");

  // 7. Repair draft requires approval
  console.log("Test 7: Repair draft requires approval...");
  const repair = generateRepairDraft(result.task.task_id, "Voice provisioning failed", "alpha_voice_comms");
  assert.strictEqual(repair.approval_status, "PENDING_APPROVAL");
  assert.strictEqual(repair.executed, false);
  console.log("-> PASS");

  // 8. No live provider mutation in default mode
  console.log("Test 8: No live provider mutation allowed...");
  const blockedAlpha = processLane("alpha_voice_comms", "BUY_LIVE_TWILIO_NUMBER_WITHOUT_APPROVAL", {});
  assert(blockedAlpha.error.includes("BLOCKED_ACTION_ATTEMPTED"));
  assert.strictEqual(blockedAlpha.receipt_type, "BLOCKED_AUDIT_FAILURE");

  const blockedBeta = processLane("beta_build_deploy", "DEPLOY_PRODUCTION_VERCEL", {});
  assert(blockedBeta.error.includes("BLOCKED_ACTION_ATTEMPTED"));
  assert.strictEqual(blockedBeta.receipt_type, "BLOCKED_AUDIT_FAILURE");

  const blockedGamma = processLane("gamma_dashboard_onboarding", "SEND_LIVE_EMAIL_TO_KERRY", {});
  assert(blockedGamma.error.includes("BLOCKED_ACTION_ATTEMPTED"));
  assert.strictEqual(blockedGamma.receipt_type, "BLOCKED_AUDIT_FAILURE");
  console.log("-> PASS");

  // 9. Secret redaction
  console.log("Test 9: Customer payload data masking (sensitive fields)...");
  const maskedPayload = redactSensitiveData(mockCustomerPayload);
  assert.strictEqual(maskedPayload.customer_email, "t**t@example.com");
  assert(maskedPayload.business_phone.endsWith("****"));
  console.log("-> PASS");

  console.log("\nAll unit tests passed successfully!");
}

if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
