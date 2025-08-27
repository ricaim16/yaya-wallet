import { config } from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import { createHmac, timingSafeEqual } from "crypto";

config();
const app = express();
const port = process.env.PORT || 5000;

// Placeholder list of YaYa Wallet IP addresses (replace with actual IPs in production)
const YAYA_WALLET_IPS = ["203.0.113.1", "203.0.113.2", "127.0.0.1", "::1"];

// Validate payload fields
const validatePayload = (payload) => {
  const requiredFields = [
    "id",
    "amount",
    "currency",
    "created_at_time",
    "timestamp",
    "cause",
    "full_name",
    "account_name",
    "invoice_url",
  ];
  for (const field of requiredFields) {
    if (!payload[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  if (typeof payload.amount !== "number") {
    return { valid: false, error: "Invalid amount type" };
  }
  if (
    typeof payload.created_at_time !== "number" ||
    typeof payload.timestamp !== "number"
  ) {
    return { valid: false, error: "Invalid timestamp type" };
  }
  return { valid: true };
};

// Create signed payload by concatenating all fields
const createSignedPayload = (payload) =>
  payload.id +
  payload.amount.toString() +
  payload.currency +
  payload.created_at_time.toString() +
  payload.timestamp.toString() +
  payload.cause +
  payload.full_name +
  payload.account_name +
  payload.invoice_url;

app.use(bodyParser.json());

// Signature generation endpoint
app.post("/generate-signature", (req, res) => {
  try {
    const payload = req.body;
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return res.status(400).send(validation.error);
    }

    const signedPayload = createSignedPayload(payload);
    const signature = createHmac("sha256", process.env.SECRET_KEY)
      .update(signedPayload, "utf-8")
      .digest("hex");

    res.status(200).json({ signature });
  } catch (err) {
    console.error("Error generating signature:", err.stack);
    res.status(500).send("Internal server error");
  }
});

// Webhook endpoint
app.post("/webhook", (req, res) => {
  try {
    // Log source IP for debugging
    const clientIp = req.ip || req.connection.remoteAddress;
    console.log("Detected IP:", clientIp);

    // Verify source IP
    if (!YAYA_WALLET_IPS.includes(clientIp)) {
      console.error(`Unauthorized IP: ${clientIp}`);
      return res.status(403).send("Unauthorized IP address");
    }

    const payload = req.body;
    const receivedSignature = req.headers["yaya-signature"];

    // Check for missing signature
    if (!receivedSignature) {
      console.error("Missing YAYA-SIGNATURE header");
      return res.status(400).send("Missing signature");
    }

    // Validate payload
    const validation = validatePayload(payload);
    if (!validation.valid) {
      console.error(validation.error);
      return res.status(400).send(validation.error);
    }

    // Prevent replay attacks (5-minute tolerance)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - payload.timestamp > 300) {
      console.error("Timestamp too old:", payload.timestamp);
      return res.status(400).send("Request too old (replay attack prevention)");
    }

    // Verify signature
    const signedPayload = createSignedPayload(payload);
    const expectedSignature = createHmac("sha256", process.env.SECRET_KEY)
      .update(signedPayload, "utf-8")
      .digest("hex");

    const isValid =
      expectedSignature.length === receivedSignature.length &&
      timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(receivedSignature, "hex")
      );

    if (!isValid) {
      console.error("Invalid signature received:", receivedSignature);
      return res.status(400).send("Invalid signature");
    }

    // Log success (replace with proper logging in production)
    console.log("Valid webhook:", JSON.stringify(payload, null, 2));

    // Return 200 quickly before further processing
    res.status(200).send("Webhook received successfully");

    // TODO: Add logic to process the webhook (e.g., update database)
  } catch (err) {
    console.error("Error processing webhook:", err.stack);
    res.status(500).send("Internal server error");
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack);
  res.status(500).send("Internal server error");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
