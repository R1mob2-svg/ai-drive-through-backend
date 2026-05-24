const { PRODUCTS } = require("../catalog/products");

function validateCustomerPayload(payload) {
  const errors = [];

  if (!payload.customer_email) {
    errors.push("Missing customer_email");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customer_email)) {
    errors.push("Invalid customer_email format");
  }

  if (!payload.product_id) {
    errors.push("Missing product_id");
  } else if (!PRODUCTS[payload.product_id]) {
    errors.push(`Unknown product_id: '${payload.product_id}'`);
  } else {
    // Check if required fields for specific product are present
    const product = PRODUCTS[payload.product_id];
    for (const field of product.required_customer_fields) {
      if (!payload[field]) {
        errors.push(`Missing required field '${field}' for product '${payload.product_id}'`);
      }
    }
  }

  if (!payload.customer_id) {
    errors.push("Missing customer_id");
  }

  if (!payload.stripe_event_id) {
    errors.push("Missing stripe_event_id");
  }

  if (!payload.stripe_checkout_session_id) {
    errors.push("Missing stripe_checkout_session_id");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function redactSensitiveData(payload) {
  const redacted = { ...payload };
  if (redacted.customer_email) {
    const parts = redacted.customer_email.split("@");
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      const maskedName = name.length > 2 ? name[0] + "*".repeat(name.length - 2) + name[name.length - 1] : "**";
      redacted.customer_email = `${maskedName}@${domain}`;
    }
  }
  if (redacted.business_phone) {
    redacted.business_phone = redacted.business_phone.slice(0, -4) + "****";
  }
  return redacted;
}

module.exports = {
  validateCustomerPayload,
  redactSensitiveData
};
