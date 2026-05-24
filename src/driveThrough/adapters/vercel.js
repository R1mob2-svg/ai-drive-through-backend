class VercelAdapter {
  constructor(mode = "MOCK") {
    this.mode = mode;
  }

  async deployRepo(githubRepo, branch = "main") {
    if (this.mode === "LIVE_BLOCKED") {
      throw new Error("SECURITY_VIOLATION: Live Vercel production deployment blocked.");
    }
    const slug = githubRepo.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return {
      deployment_id: "dpl_" + Math.random().toString(36).substr(2, 9),
      url: `https://${slug}-preview.vercel.app`,
      status: "READY",
      branch,
      mode: this.mode
    };
  }
}

module.exports = VercelAdapter;
