const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // 👈 Required for calling Speed API

const app = express();
app.use(cors());
app.use(express.json());

let userBalance = 0;

// Test endpoint
app.get("/", (req, res) => {
  res.send("🚀 HonestDrop Server Running");
});

// Simulated ad (in case of legacy testing)
app.post("/watch-ad", (req, res) => {
  userBalance += 10; 
  res.json({ message: "Ad watched, +10 sats!", balance: userBalance });
});

// Withdrawal – supports both /withdraw and /api/speed-withdraw
app.post(["/withdraw", "/api/speed-withdraw"], async (req, res) => {
  try {
    const { invoice, amount } = req.body;
    const withdrawAmount = amount || userBalance;

    if (!invoice) {
      return res.status(400).json({ success: false, message: "❗ Missing Lightning invoice." });
    }

    if (withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: "❗ No sats available for withdrawal." });
    }

    console.log(`⚡ Attempting live withdrawal | Amount: ${withdrawAmount} sats`);

    // Call Speed Wallet API
    const response = await fetch("https://api.tryspeed.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SPEED_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: withdrawAmount,
        asset: "BTC",
        network: "LIGHTNING",
        invoice // Correct field for Speed v1
      }),
    });

    const result = await response.json();
    console.log("💳 Speed API Response:", result);

    if (!response.ok || !result?.id) {
      console.error("🚨 Speed API FAILURE:", result);
      return res.status(500).json({
        success: false,
        message: "❌ Payment failed via Speed",
        speedAPI: result,
      });
    }

    userBalance -= withdrawAmount;
    if (userBalance < 0) userBalance = 0;

    return res.json({
      success: true,
      message: `⚡ Successfully sent ${withdrawAmount} sats via Speed!`,
      speedResponse: result,
    });

  } catch (error) {
    console.error("❌ Backend processing error:", error);
    return res.status(500).json({ success: false, message: `Backend error: ${error.message}` });
  }
});

// Start backend
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 HonestDrop backend running on port ${PORT}`));

