class StripeAdapter {
  constructor(mode = "MOCK") {
    this.mode = mode;
  }

  async verifyWebhookSignature(payload, signature) {
    if (this.mode === "LIVE_BLOCKED") {
      throw new Error("SECURITY_VIOLATION: Live Stripe webhook signature verification blocked.");
    }
    // In MOCK/TEST mode, we verify the presence of key fields
    if (!payload || !signature) {
      return false;
    }
    return true;
  }

  async retrieveCheckoutSession(sessionId) {
    if (this.mode === "LIVE_BLOCKED") {
      throw new Error("SECURITY_VIOLATION: Live Stripe checkout retrieval blocked.");
    }
    return {
      id: sessionId,
      payment_status: "paid",
      amount_total: 129900,
      currency: "usd",
      customer_details: {
        email: "rob.drivethru@example.com"
      }
    };
  }
}

module.exports = StripeAdapter;
