function validateVerifiedStripeEvent(event) {
  const errors = [];
  
  if (!event) {
    errors.push("Event object is null or undefined");
    return { isValid: false, errors };
  }

  if (!event.id) {
    errors.push("Missing event.id");
  }

  if (event.type !== "checkout.session.completed") {
    errors.push(`Unsupported event type: '${event.type}'`);
  }

  if (!event.data || !event.data.object) {
    errors.push("Missing event.data.object");
  } else {
    const session = event.data.object;
    if (session.payment_status !== "paid") {
      errors.push(`Session status is unpaid: '${session.payment_status}'`);
    }
  }

  // Cryptographic or status checks
  if (event.verification_status !== "VERIFIED") {
    errors.push("Stripe signature verification must be completed prior to intake");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateVerifiedStripeEvent
};
