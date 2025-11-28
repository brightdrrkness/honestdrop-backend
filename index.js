const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // Required for API call

const app = express();
app.use(cors());
app.use(express.json());

let userBalance = 0;

// Test endpoint
app.get("/", (req, res) => {
  res.send("🚀 HonestDrop Server Running");
});

// Simulate ad watching (adds sats)
app.post("/watch-ad", (req, res) => {
  userBalance += 10; // Adjust reward as needed
  res.json({ message: "Ad watched, +10 sats!", balance: userBalance });
});

// Withdraw – supports BOTH legacy and frontend call
app.post(["/withdraw", "/api/speed-withdraw"], async (req, res) => {
  try {
    const { invoice } = req.body; // Lightning invoice from frontend
    const withdrawAmount = userBalance; // Total sats earned

    if (!invoice) {
      return res.status(400).json({ success: false, message: "Missing Lightning invoice." });
    }

    if (withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: "No sats available for withdrawal." });
    }

    console.log(`⚡ Sending withdrawal | Amount: ${withdrawAmount} sats`);

    // 🔥 REAL Speed API call
    const response = await fetch("https://api.tryspeed.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SPEED_SECRET_KEY}`, // Matches your Render env key name
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: withdrawAmount,  // sats
        asset: "BTC",
        network: "LIGHTNING",
        recipient: invoice       // LN invoice provided by user
      }),
    });

    const result = await response.json();
    console.log("💸 Speed API Response:", result);

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        message: "Payment failed. Speed API error.",
        result
      });
    }

    // Reset user balance after success
    userBalance = 0;

    return res.json({
      success: true,
      message: `Successfully sent ${withdrawAmount} sats!`,
      speedResponse: result
    });

  } catch (error) {
    console.error("❌ Backend error during withdrawal:", error);
    return res.status(500).json({ success: false, message: "Backend error.", error });
  }
});

// Dynamic port (Render overrides this with 10000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 HonestDrop running on port ${PORT}`));
