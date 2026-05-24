const { PRODUCTS } = require("../catalog/products");

function performAGAudit(task, paymentEvent, receipts) {
  const auditReport = {
    audit_id: "aud_" + Math.random().toString(36).substr(2, 9),
    task_id: task.task_id,
    timestamp: new Date().toISOString(),
    passed: false,
    failures: [],
    redacted_fields: []
  };

  // 1. Verify payment source status
  if (paymentEvent.verification_status !== "VERIFIED") {
    auditReport.failures.push("Payment source is unverified/untrusted.");
  }

  // 2. Verify product template exists
  if (!PRODUCTS[task.product_id]) {
    auditReport.failures.push(`Product catalog mapping not found for: '${task.product_id}'`);
  }

  // 3. Verify no secrets leaked (e.g. no raw API keys in customer metadata or metadata fields)
  const secretsKeywords = ["sk_live", "sk_test", "twilio_token", "api_key", "password"];
  const payloadStr = JSON.stringify(task);
  for (const keyword of secretsKeywords) {
    if (payloadStr.includes(keyword)) {
      auditReport.failures.push(`Potential secret leak: found reference to '${keyword}' in payload.`);
      auditReport.redacted_fields.push(keyword);
    }
  }

  // 4. Verify no live provider mutations happened (e.g. checking that receipts don't contain audit violations)
  const containsAuditViolation = receipts.some(r => r.receipt_type === "BLOCKED_AUDIT_FAILURE");
  if (containsAuditViolation) {
    auditReport.failures.push("Security Boundary Violation: Live provider mutation attempted without permission.");
  }

  // 5. Ensure all necessary lane receipts are present
  const requiredLanes = PRODUCTS[task.product_id] ? PRODUCTS[task.product_id].allowed_fulfilment_lanes : [];
  for (const lane of requiredLanes) {
    const hasReceipt = receipts.some(r => r.lane_name === lane && r.success);
    if (!hasReceipt) {
      auditReport.failures.push(`Missing required lane receipt for lane: '${lane}'`);
    }
  }

  auditReport.passed = auditReport.failures.length === 0;
  return auditReport;
}

module.exports = {
  performAGAudit
};
