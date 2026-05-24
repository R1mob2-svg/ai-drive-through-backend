function createBlankTask({ customerRef, productId, fulfilmentTemplateId }) {
  const taskId = "task_" + Math.random().toString(36).substr(2, 9);
  return {
    task_type: "DRIVE_THROUGH_FULFILL",
    task_id: taskId,
    customer_ref: customerRef,
    product_id: productId,
    fulfilment_template_id: fulfilmentTemplateId,
    status: "QUEUED",
    lanes: {
      alpha_voice_comms: {
        lane_name: "alpha_voice_comms",
        status: "PENDING",
        lane_input: {},
        allowed_actions: ["PROVISION_TWILIO_NUMBER", "CONFIGURE_IVR", "TEST_VOICE_ROUTE"],
        blocked_actions: ["BUY_LIVE_TWILIO_NUMBER_WITHOUT_APPROVAL", "DIAL_OUT_CUSTOMER"]
      },
      beta_build_deploy: {
        lane_name: "beta_build_deploy",
        status: "PENDING",
        lane_input: {},
        allowed_actions: ["GENERATE_VITE_SCAFFOLD", "COMMIT_GMX_GATE", "TEST_BUILD"],
        blocked_actions: ["DEPLOY_PRODUCTION_VERCEL", "CHANGE_DNS_SETTINGS"]
      },
      gamma_dashboard_onboarding: {
        lane_name: "gamma_dashboard_onboarding",
        status: "PENDING",
        lane_input: {},
        allowed_actions: ["MOCK_GOOGLE_SHEET_ROW", "GENERATE_DRAFT_EMAIL"],
        blocked_actions: ["SEND_LIVE_EMAIL_TO_KERRY", "CREATE_LIVE_GDRIVE_FOLDER"]
      }
    },
    required_receipts: [],
    created_at: new Date().toISOString(),
    audit_required: true
  };
}

module.exports = {
  createBlankTask
};
