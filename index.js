const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let userBalance = 0;

app.get("/", (req, res) => {
  res.send("🚀 HonestDrop Server Running");
});

app.post("/watch-ad", (req, res) => {
  userBalance += 10;
  res.json({ message: "Ad watched, +10 sats!", balance: userBalance });
});

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

    console.log(`⚡ LIVE withdrawal | Amount: ${withdrawAmount} sats`);

    // Using native fetch (Node 18+)
    const response = await fetch("https://api.tryspeed.com/v1/send", {
      method: "POST",
headers: {
    "Authorization": "Basic " + Buffer.from(process.env.SPEED_SECRET_KEY + ":").toString("base64"),
    "Content-Type": "application/json",
},
      body: JSON.stringify({
        amount: withdrawAmount,
        asset: "BTC",
        network: "LIGHTNING",
        invoice
      }),
    });

    const result = await response.json();
    console.log("💳 Speed API Response:", result);

    if (!response.ok || !result?.id) {
      console.error("🚨 Speed API error:", result);
      return res.status(500).json({
        success: false,
        message: "❌ Payment failed via Speed.",
        speedAPI: result,
      });
    }

    userBalance -= withdrawAmount;
    if (userBalance < 0) userBalance = 0;

    return res.json({
      success: true,
      message: `⚡ Sent ${withdrawAmount} sats via Speed!`,
      speedResponse: result,
    });

  } catch (error) {
    console.error("🔥 Backend error:", error);
    return res.status(500).json({
      success: false,
      message: `Backend error: ${error.message}`,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 HonestDrop backend running on port ${PORT}`));


