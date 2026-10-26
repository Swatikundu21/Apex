
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../apexcart.db');

const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READONLY,
  (err) => {
    if (err) {
      console.error('Error opening ApexCart SQLite Database:', err);
    } else {
      console.log('Connected to ApexCart SQLite Database in read-only mode.');
    }
  }
);

db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) {
    console.error('Could not enable foreign keys:', err.message);
  }
});

module.exports = db;
