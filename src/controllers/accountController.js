const db = require('../config/db');

const PAYMENT_OPTIONS = [
  'Visa ending 4242',
  'Mastercard ending 5555',
  'PayPal',
  'Apple Pay',
  'Corporate invoice (Net 30)'
];

function profileFromRow(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    address_line: user.address_line || '',
    city: user.city || '',
    region: user.region || '',
    postal_code: user.postal_code || '',
    country: user.country || 'United States',
    payment_method: user.payment_method || ''
  };
}

exports.paymentOptions = PAYMENT_OPTIONS;

exports.getProfile = (req, res) => {
  db.get(
    `SELECT id, name, email, role, address_line, city, region, postal_code, country, payment_method
     FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'Account not found' });
      res.json({ ...profileFromRow(user), payment_options: PAYMENT_OPTIONS });
    }
  );
};

exports.updateProfile = (req, res) => {
  const address_line = String(req.body.address_line || '').trim();
  const city = String(req.body.city || '').trim();
  const region = String(req.body.region || '').trim();
  const postal_code = String(req.body.postal_code || '').trim();
  const country = String(req.body.country || 'United States').trim();
  const payment_method = String(req.body.payment_method || '').trim();

  if (payment_method && !PAYMENT_OPTIONS.includes(payment_method)) {
    return res.status(400).json({ error: 'Choose a supported payment method' });
  }

  db.run(
    `UPDATE users
     SET address_line = ?, city = ?, region = ?, postal_code = ?, country = ?, payment_method = ?
     WHERE id = ?`,
    [address_line, city, region, postal_code, country, payment_method, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get(
        `SELECT id, name, email, role, address_line, city, region, postal_code, country, payment_method
         FROM users WHERE id = ?`,
        [req.user.id],
        (getErr, user) => {
          if (getErr || !user) return res.status(500).json({ error: 'Could not load account' });
          res.json(profileFromRow(user));
        }
      );
    }
  );
};

exports.formatAddress = (user) => {
  return [user.address_line, user.city, user.region, user.postal_code, user.country]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');
};
