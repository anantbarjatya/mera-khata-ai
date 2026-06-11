const express = require("express");
const router = express.Router();
const { getDB } = require("../db/database");

router.post("/reset-all", (req, res) => {
  const db = getDB();

  try {
    // Transactions clear
    db.prepare("DELETE FROM transactions").run();

    // Customers clear
    db.prepare("DELETE FROM customers").run();

    res.json({
      success: true,
      message: "All demo data cleared"
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;