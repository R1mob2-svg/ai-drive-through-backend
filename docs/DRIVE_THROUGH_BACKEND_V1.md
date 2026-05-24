# AI Drive-Through / JoyThrough Smart Backend V1

This folder contains the simulated Smart Backend V1 designed for onboarding client templates safely without triggering production integrations (Stripe checkout sessions, Twilio numbers, or production deployment platforms).

## Architecture overview

The backend contains:
1. **Product Catalog**: Defines properties of AI receptionist, smart website, and bundle products.
2. **Customer Payload Validation**: Checks for structure constraints, maps inputs to products, and redacts/hashes emails/phone records for audits.
3. **Stripe Intake Gate**: Inspects Stripe webhook payloads and rejects any untrusted signatures.
4. **Task Orchestrator & Parallel Lanes**: Creates three isolation lanes (Alpha - Twilio, Beta - GeminX, Gamma - Sheets/Email drafts) and enforces rules rejecting execution of mutations in live environments.
5. **Receipt Registry**: Signs receipt documents cryptographically to audit all steps.
6. **AG Audit Gate**: Final audit step confirming signature authenticity and boundary compliance.
7. **Repair Lane**: Provides diagnostic logs and structured manual approvals for failed onboarding tasks.

## Safety Enforcements

By design, attempts to perform live transactions are blocked with a `BLOCKED_ACTION_ATTEMPTED` error.

To verify correctness locally, run the proof simulation script or unit tests:

```bash
npm run test
npm run proof
```
