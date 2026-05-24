const { validateVerifiedStripeEvent } = require("../schemas/verifiedPayment");
const { validateCustomerPayload } = require("../schemas/customerPayload");
const { createFulfilmentTask } = require("./createFulfilmentTask");

function processVerifiedPaymentIntake(stripeEvent, customerPayload) {
  // 1. Verify payment status/trust
  const paymentValidation = validateVerifiedStripeEvent(stripeEvent);
  if (!paymentValidation.isValid) {
    return {
      status: "EVENT_REJECTED_UNTRUSTED",
      errors: paymentValidation.errors,
      receipt_type: "EVENT_REJECTED_UNTRUSTED"
    };
  }

  // 2. Validate customer payload
  const customerValidation = validateCustomerPayload(customerPayload);
  if (!customerValidation.isValid) {
    return {
      status: "PAYLOAD_INVALID",
      errors: customerValidation.errors,
      receipt_type: "BLOCKED_AUDIT_FAILURE"
    };
  }

  // 3. Create the fulfilment task
  const task = createFulfilmentTask(customerPayload);

  return {
    status: "DRIVE_THROUGH_FULFILL",
    task,
    receipt_type: "DRIVE_THROUGH_TASK_CREATED_RECEIPT"
  };
}

module.exports = {
  processVerifiedPaymentIntake
};
