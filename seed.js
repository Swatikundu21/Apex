const db = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { detailsFor } = require('./productDetails');

const products = [
  ['p1', 'APX-WCH-001', 'Apex SmartWatch Ultra Titanium', 'wearables', 'Titanium case, always-on display, and 7-day battery for field teams.', 749, 14, 5, 4.9, 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80'],
  ['p2', 'APX-AUD-002', 'Apex Studio Wireless Headphones', 'audio', 'Studio-grade ANC headphones with 40 hours of playback.', 399, 3, 5, 4.8, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
  ['p3', 'APX-LAP-003', 'Apex Silicon M3 Workstation Laptop', 'laptops', '15-inch workstation laptop for CAD, compile, and video work.', 1999, 8, 2, 5.0, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'],
  ['p4', 'APX-ACC-004', 'MagCharge Enterprise 3-in-1 Hub', 'accessories', 'Desk charger for phone, watch, and earbuds in one stand.', 129, 45, 10, 4.7, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80'],
  ['p5', 'APX-EAR-005', 'Apex Pulse Noise-Cancel Earbuds', 'audio', 'Compact earbuds with adaptive ANC and USB-C case.', 179, 32, 8, 4.6, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'],
  ['p6', 'APX-CAM-006', 'Apex 4K Conference Webcam', 'accessories', '4K sensor, auto-framing, and dual mics for hybrid meetings.', 219, 21, 6, 4.5, 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?auto=format&fit=crop&w=800&q=80'],
  ['p7', 'APX-KEY-007', 'Apex Tactile Mechanical Keyboard', 'accessories', 'Hot-swap switches, aluminum frame, and per-key lighting.', 189, 18, 5, 4.8, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80'],
  ['p8', 'APX-MON-008', 'Apex Ultrawide 34" Monitor', 'monitors', '3440×1440 ultrawide with USB-C 90W power delivery.', 899, 6, 2, 4.9, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'],
  ['p9', 'APX-BAG-009', 'Apex Carbon Commuter Backpack', 'accessories', 'Weatherproof 22L pack with laptop sleeve and RFID pocket.', 149, 27, 6, 4.4, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'],
  ['p10', 'APX-FIT-010', 'Apex Pulse Fitness Band', 'wearables', 'Lightweight band with SpO2, sleep, and workout maps.', 89, 40, 10, 4.3, 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80'],
  ['p11', 'APX-TAB-011', 'Apex Tablet Studio 12', 'tablets', '12.9-inch OLED tablet with stylus for markup and design.', 1099, 11, 3, 4.7, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80'],
  ['p12', 'APX-DOK-012', 'Apex USB-C Dock 12-Port', 'accessories', 'Dual 4K outputs, 2.5G ethernet, and 100W pass-through.', 249, 16, 4, 4.6, 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80'],
  ['p13', 'APX-MIC-013', 'Apex Broadcast Studio Mic', 'audio', 'USB condenser mic with hardware mute and gain.', 159, 22, 5, 4.5, 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80'],
  ['p14', 'APX-MOU-014', 'Apex Precision Gaming Mouse', 'accessories', '26K sensor, PTFE skates, and 70-hour wireless battery.', 99, 35, 8, 4.4, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80'],
  ['p15', 'APX-HUB-015', 'Apex Home Hub Mini', 'smart-home', 'Thread/Matter hub with privacy shutter and room sensors.', 129, 19, 5, 4.2, 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=800&q=80'],
  ['p16', 'APX-PWR-016', 'Apex PowerBank 27,000 mAh', 'accessories', 'Two USB-C PD ports for laptop top-ups on the road.', 119, 50, 12, 4.6, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80']
];

const reviews = [
  ['rev-1', 'p1', 'usr-cust-01', 5, 'Battery easily lasts a work week. The titanium finish feels premium.'],
  ['rev-2', 'p1', 'usr-cust-02', 4, 'Great watch. Notifications are a bit noisy until you tune them.'],
  ['rev-3', 'p2', 'usr-cust-02', 5, 'ANC is excellent on flights. Comfortable for long sessions.'],
  ['rev-4', 'p2', 'usr-cust-01', 4, 'Sound is rich. Case is bulky in a small bag.'],
  ['rev-5', 'p3', 'usr-cust-01', 5, 'Compiles our monorepo without fans screaming. Worth it.'],
  ['rev-6', 'p5', 'usr-cust-02', 4, 'Secure fit for runs. App pairing took two tries.'],
  ['rev-7', 'p8', 'usr-cust-01', 5, 'The ultrawide replaced two monitors on my desk.'],
  ['rev-8', 'p7', 'usr-cust-02', 5, 'Switches feel crisp. Aluminum frame does not flex.'],
  ['rev-9', 'p11', 'usr-cust-01', 4, 'Screen is gorgeous for markup. Wish it had more storage.'],
  ['rev-10', 'p4', 'usr-cust-02', 5, 'One cable on the desk now. Charges watch overnight.']
];

async function seed() {
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  db.exec(schemaSql, (err) => {
    if (err) {
      console.error('Schema Execution Error:', err);
      db.close();
      process.exit(1);
    }
    console.log('✓ Tables initialized.');

    db.serialize(() => {
      const userStmt = db.prepare(
        `INSERT INTO users (id, name, email, password_hash, role, address_line, city, region, postal_code, country, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      userStmt.run(
        'usr-admin-01', 'Lead Architect', 'admin@apexcart.com', adminHash, 'admin',
        '1 Apex Plaza', 'San Francisco', 'CA', '94105', 'United States', 'Corporate invoice (Net 30)'
      );
      userStmt.run(
        'usr-cust-01', 'Alex Morgan', 'alex@example.com', userHash, 'customer',
        '210 Market Street, Suite 4', 'Austin', 'TX', '78701', 'United States', 'Visa ending 4242'
      );
      userStmt.run(
        'usr-cust-02', 'Priya Shah', 'priya@example.com', userHash, 'customer',
        '88 Harbor Walk', 'Seattle', 'WA', '98101', 'United States', 'PayPal'
      );
      userStmt.finalize();

      const prodStmt = db.prepare(
        `INSERT INTO products (id, sku, name, category, description, price_usd, stock, safety_stock, rating, image_url, delivery_days, warranty, return_policy, specifications)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      products.forEach((row) => {
        const extra = detailsFor(row[0]);
        prodStmt.run([...row, extra.delivery_days, extra.warranty, extra.return_policy, JSON.stringify(extra.specifications)]);
      });
      prodStmt.finalize();

      const reviewStmt = db.prepare(
        'INSERT INTO reviews (id, product_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)'
      );
      reviews.forEach((row) => reviewStmt.run(row));
      reviewStmt.finalize((finalizeErr) => {
        if (finalizeErr) {
          console.error('Seed Error:', finalizeErr);
          db.close();
          process.exit(1);
        }
        console.log(`✓ Database seeded with ${products.length} products and ${reviews.length} reviews.`);
        console.log('  Admin:    admin@apexcart.com / admin123');
        console.log('  Customer: alex@example.com / user123');
        db.close();
      });
    });
  });
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
