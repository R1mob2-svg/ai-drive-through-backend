const TwilioAdapter = require("../adapters/twilio");
const VercelAdapter = require("../adapters/vercel");
const SheetsAdapter = require("../adapters/sheets");
const EmailAdapter = require("../adapters/email");
const { processLane } = require("./laneModel");
const { compileFulfilmentSummary } = require("./fulfilmentSummary");
const { generateReceipt } = require("../receipts/receiptWriter");
const { performAGAudit } = require("../audit/agAuditHandoff");
const { readData, writeData } = require("../db");

async function executeTaskQueue(task, stripeEvent, mode = "MOCK") {
  const twilio = new TwilioAdapter(mode);
  const vercel = new VercelAdapter(mode);
  const sheets = new SheetsAdapter(mode);
  const email = new EmailAdapter(mode);

  const laneReceipts = [];

  // Update status to PROCESSING
  task.status = "PROCESSING";
  saveTask(task);

  try {
    // 1. Process Alpha Lane (Voice/Comms)
    if (task.lanes.alpha_voice_comms) {
      task.lanes.alpha_voice_comms.status = "PROCESSING";
      saveTask(task);

      try {
        const provisionResult = await twilio.provisionPhoneNumber("206");
        await twilio.configureIVR(provisionResult.sid, "https://api.drivethru.ai/ivr");
        
        task.lanes.alpha_voice_comms.status = "COMPLETED";
        const receipt = generateReceipt("ALPHA_VOICE_COMMS_RECEIPT", {
          task_id: task.task_id,
          provisioned_number: provisionResult.phoneNumber,
          status: "PROVISIONED",
          timestamp: new Date().toISOString()
        });
        saveReceipt(receipt);
        laneReceipts.push({ lane_name: "alpha_voice_comms", success: true, receipt_type: receipt.receipt_type });
      } catch (err) {
        task.lanes.alpha_voice_comms.status = "FAILED";
        const errorReceipt = generateReceipt("BLOCKED_AUDIT_FAILURE", {
          reason: err.message,
          violated_surface: "alpha_voice_comms_twilio",
          timestamp: new Date().toISOString()
        });
        saveReceipt(errorReceipt);
        laneReceipts.push({ lane_name: "alpha_voice_comms", success: false, receipt_type: errorReceipt.receipt_type, error: err.message });
      }
    }

    // 2. Process Beta Lane (Build/Deploy)
    if (task.lanes.beta_build_deploy) {
      task.lanes.beta_build_deploy.status = "PROCESSING";
      saveTask(task);

      try {
        const deployResult = await vercel.deployRepo(task.lanes.beta_build_deploy.lane_input.repo_name);
        
        task.lanes.beta_build_deploy.status = "COMPLETED";
        const receipt = generateReceipt("BETA_BUILD_DEPLOY_RECEIPT", {
          task_id: task.task_id,
          github_repo: task.lanes.beta_build_deploy.lane_input.repo_name,
          build_status: "SUCCESS",
          timestamp: new Date().toISOString()
        });
        saveReceipt(receipt);
        laneReceipts.push({ lane_name: "beta_build_deploy", success: true, receipt_type: receipt.receipt_type });
      } catch (err) {
        task.lanes.beta_build_deploy.status = "FAILED";
        const errorReceipt = generateReceipt("BLOCKED_AUDIT_FAILURE", {
          reason: err.message,
          violated_surface: "beta_build_deploy_vercel",
          timestamp: new Date().toISOString()
        });
        saveReceipt(errorReceipt);
        laneReceipts.push({ lane_name: "beta_build_deploy", success: false, receipt_type: errorReceipt.receipt_type, error: err.message });
      }
    }

    // 3. Process Gamma Lane (Dashboard/Onboarding)
    if (task.lanes.gamma_dashboard_onboarding) {
      task.lanes.gamma_dashboard_onboarding.status = "PROCESSING";
      saveTask(task);

      try {
        const sheetResult = await sheets.appendRow("sheet_12345", "Onboarding", [
          task.customer_ref,
          task.product_id,
          task.lanes.gamma_dashboard_onboarding.lane_input.business_name
        ]);
        const emailResult = await email.sendEmail(
          task.lanes.gamma_dashboard_onboarding.lane_input.customer_email,
          "Welcome to AI Drive-Through",
          "Your smart services are active."
        );
        
        task.lanes.gamma_dashboard_onboarding.status = "COMPLETED";
        const receipt = generateReceipt("GAMMA_DASHBOARD_ONBOARDING_RECEIPT", {
          task_id: task.task_id,
          sheet_row_added: 1, // Mock row offset
          welcome_email_drafted: emailResult.drafted,
          timestamp: new Date().toISOString()
        });
        saveReceipt(receipt);
        laneReceipts.push({ lane_name: "gamma_dashboard_onboarding", success: true, receipt_type: receipt.receipt_type });
      } catch (err) {
        task.lanes.gamma_dashboard_onboarding.status = "FAILED";
        const errorReceipt = generateReceipt("BLOCKED_AUDIT_FAILURE", {
          reason: err.message,
          violated_surface: "gamma_dashboard_onboarding_sheets_email",
          timestamp: new Date().toISOString()
        });
        saveReceipt(errorReceipt);
        laneReceipts.push({ lane_name: "gamma_dashboard_onboarding", success: false, receipt_type: errorReceipt.receipt_type, error: err.message });
      }
    }

    // Compile summary
    const summary = compileFulfilmentSummary(task, laneReceipts);
    task.status = summary.status;
    saveTask(task);

    // Save summary receipt
    const summaryReceipt = generateReceipt("DRIVE_THROUGH_FULFILMENT_SUMMARY_RECEIPT", {
      summary_id: summary.summary_id,
      task_id: summary.task_id,
      status: summary.status,
      collected_receipts: summary.receipts_collected.join(", "),
      completed_at: summary.timestamp
    });
    saveReceipt(summaryReceipt);

    // Run final AG Audit Lane
    const auditReport = performAGAudit(task, stripeEvent, laneReceipts);
    
    return {
      task,
      summary,
      summaryReceipt,
      auditReport
    };

  } catch (globalErr) {
    task.status = "FAILED";
    saveTask(task);
    throw globalErr;
  }
}

function saveTask(task) {
  const tasks = readData("tasks");
  const idx = tasks.findIndex(t => t.task_id === task.task_id);
  if (idx !== -1) {
    tasks[idx] = task;
  } else {
    tasks.push(task);
  }
  writeData("tasks", tasks);
}

function saveReceipt(receipt) {
  const receipts = readData("receipts");
  receipts.push(receipt);
  writeData("receipts", receipts);
}

module.exports = {
  executeTaskQueue
};
