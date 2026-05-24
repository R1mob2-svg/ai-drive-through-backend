const RECEIPT_TEMPLATES = {
  VERIFIED_PAYMENT_RECEIPT: {
    type: "VERIFIED_PAYMENT_RECEIPT",
    fields: ["event_id", "session_id", "customer_email", "amount_paid", "verified_at"]
  },
  DRIVE_THROUGH_TASK_CREATED_RECEIPT: {
    type: "DRIVE_THROUGH_TASK_CREATED_RECEIPT",
    fields: ["task_id", "customer_ref", "product_id", "template_id", "created_at"]
  },
  ALPHA_VOICE_COMMS_RECEIPT: {
    type: "ALPHA_VOICE_COMMS_RECEIPT",
    fields: ["task_id", "provisioned_number", "status", "timestamp"]
  },
  BETA_BUILD_DEPLOY_RECEIPT: {
    type: "BETA_BUILD_DEPLOY_RECEIPT",
    fields: ["task_id", "github_repo", "build_status", "timestamp"]
  },
  GAMMA_DASHBOARD_ONBOARDING_RECEIPT: {
    type: "GAMMA_DASHBOARD_ONBOARDING_RECEIPT",
    fields: ["task_id", "sheet_row_added", "welcome_email_drafted", "timestamp"]
  },
  DRIVE_THROUGH_FULFILMENT_SUMMARY_RECEIPT: {
    type: "DRIVE_THROUGH_FULFILMENT_SUMMARY_RECEIPT",
    fields: ["summary_id", "task_id", "status", "collected_receipts", "completed_at"]
  },
  BLOCKED_AUDIT_FAILURE: {
    type: "BLOCKED_AUDIT_FAILURE",
    fields: ["reason", "violated_surface", "timestamp"]
  },
  EVENT_REJECTED_UNTRUSTED: {
    type: "EVENT_REJECTED_UNTRUSTED",
    fields: ["event_id", "reason", "timestamp"]
  }
};

module.exports = {
  RECEIPT_TEMPLATES
};
