const db = require('../config/db');

const listSql = `
  SELECT p.*,
    ROUND(COALESCE(AVG(r.rating), p.rating), 1) AS rating,
    COUNT(r.id) AS review_count,
    w.created_at AS saved_at
  FROM wishlist w
  JOIN products p ON p.id = w.product_id
  LEFT JOIN reviews r ON r.product_id = p.id
  WHERE w.user_id = ?
  GROUP BY p.id
  ORDER BY w.created_at DESC
`;

exports.list = (req, res) => {
  db.all(listSql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(parseProduct));
  });
};

exports.add = (req, res) => {
  const productId = req.body.product_id;
  if (!productId) return res.status(400).json({ error: 'product_id is required' });

  db.get('SELECT id FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    db.run(
      'INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [req.user.id, productId],
      function (insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        res.status(201).json({ message: 'Saved to wishlist', product_id: productId });
      }
    );
  });
};

exports.remove = (req, res) => {
  db.run(
    'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
    [req.user.id, req.params.productId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Removed from wishlist' });
    }
  );
};

function parseProduct(row) {
  let specifications = [];
  try {
    specifications = JSON.parse(row.specifications || '[]');
  } catch {
    specifications = [];
  }
  return { ...row, specifications };
}
