const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { catalog, fallback } = require('./productDetails');

const dbPath = path.resolve(__dirname, '../../apexcart.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite Database:', err);
  } else {
    console.log('Connected to ApexCart SQLite Database.');
  }
});

function addColumn(table, column, type) {
  db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, () => {});
}

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  addColumn('users', 'address_line', "TEXT DEFAULT ''");
  addColumn('users', 'city', "TEXT DEFAULT ''");
  addColumn('users', 'region', "TEXT DEFAULT ''");
  addColumn('users', 'postal_code', "TEXT DEFAULT ''");
  addColumn('users', 'country', "TEXT DEFAULT 'United States'");
  addColumn('users', 'payment_method', "TEXT DEFAULT ''");
  addColumn('products', 'delivery_days', 'INT NOT NULL DEFAULT 4');
  addColumn('products', 'warranty', "TEXT NOT NULL DEFAULT ''");
  addColumn('products', 'return_policy', "TEXT NOT NULL DEFAULT ''");
  addColumn('products', 'specifications', "TEXT NOT NULL DEFAULT '[]'");
  addColumn('orders', 'delivery_address', "TEXT DEFAULT ''");
  addColumn('orders', 'payment_method', "TEXT DEFAULT ''");

  db.run(`
    CREATE TABLE IF NOT EXISTS wishlist (
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  db.all('SELECT id, warranty FROM products', [], (err, rows) => {
    if (err || !rows) return;
    const stmt = db.prepare(
      'UPDATE products SET delivery_days = ?, warranty = ?, return_policy = ?, specifications = ? WHERE id = ?'
    );
    rows.forEach((row) => {
      if (row.warranty) return;
      const details = catalog[row.id] || fallback;
      stmt.run(
        details.delivery_days,
        details.warranty,
        details.return_policy,
        JSON.stringify(details.specifications),
        row.id
      );
    });
    stmt.finalize();
  });

  db.run(`UPDATE users SET address_line = '210 Market Street, Suite 4', city = 'Austin', region = 'TX',
    postal_code = '78701', country = 'United States', payment_method = 'Visa ending 4242'
    WHERE email = 'alex@example.com' AND IFNULL(address_line, '') = ''`);
  db.run(`UPDATE users SET address_line = '88 Harbor Walk', city = 'Seattle', region = 'WA',
    postal_code = '98101', country = 'United States', payment_method = 'PayPal'
    WHERE email = 'priya@example.com' AND IFNULL(address_line, '') = ''`);
});

module.exports = db;
