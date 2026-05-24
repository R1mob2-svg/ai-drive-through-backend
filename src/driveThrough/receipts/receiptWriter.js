const { RECEIPT_TEMPLATES } = require("./receiptTypes");

function generateReceipt(type, data) {
  const template = RECEIPT_TEMPLATES[type];
  if (!template) {
    throw new Error(`Invalid receipt type: ${type}`);
  }

  const receipt = {
    receipt_id: "rcpt_" + Math.random().toString(36).substr(2, 9),
    receipt_type: type,
    timestamp: new Date().toISOString(),
    payload: {}
  };

  // Populate fields based on template rules
  for (const field of template.fields) {
    receipt.payload[field] = data[field] !== undefined ? data[field] : null;
  }

  // Generate signature (simulated cryptographic signature)
  const hashString = JSON.stringify(receipt.payload);
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    hash = (hash << 5) - hash + hashString.charCodeAt(i);
    hash |= 0;
  }
  receipt.cryptographic_signature = "sig_sha256_" + Math.abs(hash).toString(16);

  return receipt;
}

module.exports = {
  generateReceipt
};
