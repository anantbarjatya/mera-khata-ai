/**
 * routes/inventory.js
 * CRUD for stock items + the "add invoice items to stock" endpoint.
 */

const express = require("express");
const router  = express.Router();
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db/database");

// GET /api/inventory — list all stock
router.get("/", (req, res) => {
  const db = getDB();
  const rows = db.prepare("SELECT * FROM inventory ORDER BY item_name").all();
  res.json(rows);
});

// POST /api/inventory — add a single item manually
router.post("/", (req, res) => {
  const db = getDB();
  const { item_name, quantity, unit, cost_price, sell_price } = req.body;
  if (!item_name) return res.status(400).json({ error: "item_name required" });

  const item_id = `inv-${uuidv4().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO inventory (item_id, item_name, quantity, unit, cost_price, sell_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(item_id, item_name, quantity || 0, unit || "unit", cost_price || 0, sell_price || 0);

  res.status(201).json({ item_id, item_name, quantity, unit, cost_price, sell_price });
});

// POST /api/inventory/bulk — used after Vision parses an invoice
// Body: { items: [{item_name, quantity, unit, price}] }
router.post("/bulk", (req, res) => {
  const db = getDB();
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "items array required" });

  const insertOrUpdate = db.prepare(`
    INSERT INTO inventory (item_id, item_name, quantity, unit, cost_price)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(item_name) DO UPDATE SET
      quantity   = quantity + excluded.quantity,
      cost_price = excluded.cost_price,
      updated_at = datetime('now')
  `);

  const addedItems = [];
  const tx = db.transaction(() => {
    for (const item of items) {
      const item_id = `inv-${uuidv4().slice(0, 8)}`;
      insertOrUpdate.run(
        item_id,
        item.item_name,
        item.quantity || 0,
        item.unit || "unit",
        item.price || 0
      );
      addedItems.push(item);
    }
  });
  tx();

  res.json({ success: true, added: addedItems.length, items: addedItems });
});

// PATCH /api/inventory/:id — update stock quantity
router.patch("/:id", (req, res) => {
  const db = getDB();
  const { quantity, sell_price } = req.body;
  db.prepare(`
    UPDATE inventory SET quantity = ?, sell_price = ?, updated_at = datetime('now')
    WHERE item_id = ?
  `).run(quantity, sell_price, req.params.id);
  res.json({ success: true });
});

// DELETE /api/inventory/:id
router.delete("/:id", (req, res) => {
  const db = getDB();
  db.prepare("DELETE FROM inventory WHERE item_id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;