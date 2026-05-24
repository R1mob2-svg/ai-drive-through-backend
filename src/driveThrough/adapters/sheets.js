class SheetsAdapter {
  constructor(mode = "MOCK") {
    this.mode = mode;
  }

  async appendRow(spreadsheetId, tabName, rowData) {
    if (this.mode === "LIVE_BLOCKED") {
      throw new Error("SECURITY_VIOLATION: Live Google Sheets append blocked.");
    }
    return {
      spreadsheetId,
      tabName,
      appendedRow: rowData,
      status: "SUCCESS_SIMULATED",
      updatedRange: `${tabName}!A1:E1`
    };
  }
}

module.exports = SheetsAdapter;
