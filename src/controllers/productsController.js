const db = require('../config/db');

function parseProduct(row) {
  let specifications = [];
  try {
    specifications = JSON.parse(row.specifications || '[]');
  } catch {
    specifications = [];
  }
  return { ...row, specifications };
}

const productListSql = `
  SELECT p.*,
    ROUND(COALESCE(AVG(r.rating), p.rating), 1) AS rating,
    COUNT(r.id) AS review_count
  FROM products p
  LEFT JOIN reviews r ON r.product_id = p.id
  GROUP BY p.id
  ORDER BY p.name ASC
`;

exports.getAllProducts = (req, res) => {
  db.all(productListSql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(parseProduct));
  });
};

exports.getProduct = (req, res) => {
  const sql = `
    SELECT p.*,
      ROUND(COALESCE(AVG(r.rating), p.rating), 1) AS rating,
      COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON r.product_id = p.id
    WHERE p.id = ?
    GROUP BY p.id
  `;
  db.get(sql, [req.params.id], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const reviewSql = `
      SELECT r.id, r.rating, r.comment, r.created_at, u.name AS author
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `;
    db.all(reviewSql, [req.params.id], (reviewErr, reviews) => {
      if (reviewErr) return res.status(500).json({ error: reviewErr.message });
      res.json({ ...parseProduct(product), reviews });
    });
  });
};

exports.updateStock = (req, res) => {
  const { stock } = req.body;
  const { id } = req.params;
  const qty = Number(stock);

  if (!Number.isFinite(qty) || qty < 0) {
    return res.status(400).json({ error: 'Stock must be a non-negative number' });
  }

  db.run('UPDATE products SET stock = ? WHERE id = ?', [qty, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Stock updated', stock: qty });
  });
};

exports.createReview = (req, res) => {
  const productId = req.params.id;
  const rating = Number(req.body.rating);
  const comment = (req.body.comment || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1 to 5' });
  }
  if (comment.length < 8) {
    return res.status(400).json({ error: 'Please write a short review (8+ characters)' });
  }

  db.get('SELECT id FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const reviewId = `rev-${Date.now()}`;
    db.run(
      'INSERT INTO reviews (id, product_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [reviewId, productId, req.user.id, rating, comment],
      function (insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });

        db.get('SELECT ROUND(AVG(rating), 1) AS rating FROM reviews WHERE product_id = ?', [productId], (avgErr, row) => {
          if (!avgErr && row) {
            db.run('UPDATE products SET rating = ? WHERE id = ?', [row.rating, productId]);
          }
          res.status(201).json({
            id: reviewId,
            rating,
            comment,
            author: req.user.email,
            message: 'Review posted'
          });
        });
      }
    );
  });
};
