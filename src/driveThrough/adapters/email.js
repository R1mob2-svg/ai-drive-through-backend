class EmailAdapter {
  constructor(mode = "MOCK") {
    this.mode = mode;
  }

  async sendEmail(to, subject, bodyContent) {
    if (this.mode === "LIVE_BLOCKED") {
      throw new Error("SECURITY_VIOLATION: Direct customer email dispatch is blocked.");
    }
    return {
      messageId: "msg_" + Math.random().toString(36).substr(2, 9),
      to,
      subject,
      drafted: true,
      sent: false, // In mock, we generate drafts but do not deliver them
      status: "DRAFT_SAVED",
      mode: this.mode
    };
  }
}

module.exports = EmailAdapter;
