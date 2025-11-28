const express = require("express");
const cors = require("cors");

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
  userBalance += 10;
  res.json({
    success: true,
    message: "Ad watched, +10 sats!",
    balance: userBalance
  });
});

// Withdraw – supports BOTH legacy and frontend call
app.post(["/withdraw", "/api/speed-withdraw"], (req, res) => {
  const withdrawnAmount = userBalance;
  userBalance = 0;
  res.json({
    success: true,
    withdrawnAmount: withdrawnAmount,
    message: "Withdrawal successful."
  });
});

// Dynamic port (Render overrides this with 10000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 HonestDrop running on port ${PORT}`));
