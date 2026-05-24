function compileFulfilmentSummary(task, laneReceipts) {
  const allSucceeded = laneReceipts.every(r => r.success);
  const containsBlocked = laneReceipts.some(r => r.error && r.error.includes("BLOCKED_ACTION_ATTEMPTED"));

  const summary = {
    summary_id: "sum_" + Math.random().toString(36).substr(2, 9),
    task_id: task.task_id,
    customer_ref: task.customer_ref,
    product_id: task.product_id,
    timestamp: new Date().toISOString(),
    status: allSucceeded ? "COMPLETED" : (containsBlocked ? "FAILED_AUDIT_VIOLATION" : "FAILED"),
    receipts_collected: laneReceipts.map(r => r.receipt_type),
    details: laneReceipts
  };

  return summary;
}

module.exports = {
  compileFulfilmentSummary
};
