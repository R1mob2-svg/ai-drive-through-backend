const PRODUCTS = {
  AI_RECEPTIONIST: {
    product_id: "AI_RECEPTIONIST",
    display_name: "AI Receptionist",
    price_model: "SETUP_PLUS_SUBSCRIPTION",
    setup_fee: 49900, // in cents
    monthly_fee: 4900,  // in cents
    required_customer_fields: ["business_name", "business_phone"],
    fulfilment_template_id: "tmpl_voice_receptionist_v1",
    proof_requirements: ["voice_number_provisioned", "receptionist_prompt_loaded"],
    allowed_fulfilment_lanes: ["alpha_voice_comms", "gamma_dashboard_onboarding"]
  },
  SMART_WEBSITE: {
    product_id: "SMART_WEBSITE",
    display_name: "Smart Website",
    price_model: "SETUP_PLUS_SUBSCRIPTION",
    setup_fee: 99900,
    monthly_fee: 9900,
    required_customer_fields: ["business_name", "business_phone"],
    fulfilment_template_id: "tmpl_smart_website_v1",
    proof_requirements: ["github_repo_created", "vercel_deployment_uri"],
    allowed_fulfilment_lanes: ["beta_build_deploy", "gamma_dashboard_onboarding"]
  },
  GATEKEEPER_CHAT: {
    product_id: "GATEKEEPER_CHAT",
    display_name: "Gatekeeper Chat",
    price_model: "SETUP_PLUS_SUBSCRIPTION",
    setup_fee: 29900,
    monthly_fee: 2900,
    required_customer_fields: ["business_name"],
    fulfilment_template_id: "tmpl_gatekeeper_chat_v1",
    proof_requirements: ["widget_js_compiled", "onboarding_docs_injected"],
    allowed_fulfilment_lanes: ["beta_build_deploy", "gamma_dashboard_onboarding"]
  },
  LEAD_RECOVERY: {
    product_id: "LEAD_RECOVERY",
    display_name: "Lead Recovery & Follow-up",
    price_model: "SUBSCRIPTION_ONLY",
    setup_fee: 0,
    monthly_fee: 7900,
    required_customer_fields: ["business_name", "business_phone"],
    fulfilment_template_id: "tmpl_lead_recovery_v1",
    proof_requirements: ["followup_automation_active"],
    allowed_fulfilment_lanes: ["gamma_dashboard_onboarding"]
  },
  SMART_WEBSITE_PLUS_RECEPTIONIST: {
    product_id: "SMART_WEBSITE_PLUS_RECEPTIONIST",
    display_name: "Smart Website + AI Receptionist Bundle",
    price_model: "SETUP_PLUS_SUBSCRIPTION",
    setup_fee: 129900,
    monthly_fee: 12900,
    required_customer_fields: ["business_name", "business_phone"],
    fulfilment_template_id: "tmpl_bundle_website_voice_v1",
    proof_requirements: ["github_repo_created", "vercel_deployment_uri", "voice_number_provisioned"],
    allowed_fulfilment_lanes: ["alpha_voice_comms", "beta_build_deploy", "gamma_dashboard_onboarding"]
  }
};

module.exports = { PRODUCTS };
