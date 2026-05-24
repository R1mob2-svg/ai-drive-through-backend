const { PRODUCTS } = require("../catalog/products");
const { createBlankTask } = require("../schemas/fulfilmentTask");

function createFulfilmentTask(customerPayload) {
  const product = PRODUCTS[customerPayload.product_id];
  
  const task = createBlankTask({
    customerRef: customerPayload.customer_id,
    productId: customerPayload.product_id,
    fulfilmentTemplateId: product.fulfilment_template_id
  });

  // Populate lane inputs based on customer payload
  if (task.lanes.alpha_voice_comms) {
    task.lanes.alpha_voice_comms.lane_input = {
      business_name: customerPayload.business_name,
      business_phone: customerPayload.business_phone,
      setup_fee: product.setup_fee
    };
  }

  if (task.lanes.beta_build_deploy) {
    task.lanes.beta_build_deploy.lane_input = {
      business_name: customerPayload.business_name,
      github_org: "drivethru-clients",
      repo_name: `site-${customerPayload.business_name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
    };
  }

  if (task.lanes.gamma_dashboard_onboarding) {
    task.lanes.gamma_dashboard_onboarding.lane_input = {
      customer_email: customerPayload.customer_email,
      business_name: customerPayload.business_name,
      monthly_fee: product.monthly_fee
    };
  }

  return task;
}

module.exports = {
  createFulfilmentTask
};
