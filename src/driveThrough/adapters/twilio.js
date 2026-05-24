class TwilioAdapter {
  constructor(mode = "MOCK") {
    this.mode = mode;
  }

  async provisionPhoneNumber(areaCode) {
    if (this.mode === "LIVE_BLOCKED") {
      throw new Error("SECURITY_VIOLATION: Live Twilio number purchase is blocked.");
    }
    return {
      phoneNumber: `+1${areaCode}5550199`,
      sid: "PN" + Math.random().toString(36).substr(2, 32).toUpperCase(),
      status: "active",
      mode: this.mode
    };
  }

  async configureIVR(phoneNumberSid, webhookUrl) {
    if (this.mode === "LIVE_BLOCKED") {
      throw new Error("SECURITY_VIOLATION: Live Twilio IVR configuration is blocked.");
    }
    return {
      status: "configured",
      webhookUrl
    };
  }
}

module.exports = TwilioAdapter;
