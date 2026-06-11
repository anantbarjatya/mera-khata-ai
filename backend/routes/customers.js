/**
 * routes/customers.js
 */

const express = require("express");
const router  = express.Router();
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db/database");

// GET /api/customers
router.get("/", (req, res) => {
  const db = getDB();
  const rows = db.prepare("SELECT * FROM customers ORDER BY name").all();
  res.json(rows);
});

// POST /api/customers — upsert by name (kirana shopkeepers know customers by name)
router.post("/", (req, res) => {
  const db = getDB();
  const { name, phone } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });

  // Check if exists
  const existing = db.prepare("SELECT * FROM customers WHERE LOWER(name) = LOWER(?)").get(name);
  if (existing) return res.json(existing);

  const customer_id = `cust-${uuidv4().slice(0, 8)}`;
  db.prepare("INSERT INTO customers (customer_id, name, phone) VALUES (?, ?, ?)").run(customer_id, name, phone || null);
  res.status(201).json({ customer_id, name, phone, total_due: 0 });
});

// PATCH /api/customers/:id/settle — mark udhaar as paid
router.patch("/:id/settle", (req, res) => {
  const db = getDB();
  const { amount } = req.body; // partial or full payment
  const customer = db.prepare("SELECT * FROM customers WHERE customer_id = ?").get(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const newDue = Math.max(0, customer.total_due - (amount || customer.total_due));
  db.prepare("UPDATE customers SET total_due = ? WHERE customer_id = ?").run(newDue, req.params.id);

  // Mark relevant transactions as paid if full settlement
  if (newDue === 0) {
    db.prepare("UPDATE transactions SET status = 'paid' WHERE customer_id = ? AND status = 'udhaar'").run(req.params.id);
  }

  res.json({ success: true, new_balance: newDue });
});


router.delete("/:id", (req, res) => {
  const db = getDB();

  const customer = db
    .prepare("SELECT * FROM customers WHERE customer_id = ?")
    .get(req.params.id);

  if (!customer) {
    return res.status(404).json({
      error: "Customer not found"
    });
  }

  db.prepare(
    "DELETE FROM transactions WHERE customer_id = ?"
  ).run(req.params.id);

  db.prepare(
    "DELETE FROM customers WHERE customer_id = ?"
  ).run(req.params.id);

  res.json({
    success: true
  });
});
module.exports = router;