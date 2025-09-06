const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key_here', // Change this
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'cashier_db'
});

connection.connect(err => {
  if (err) console.error('Database connection failed: ' + err.stack);
  else console.log('Database connected');
});

// Auth middleware
const isLoggedIn = (req, res, next) => {
  if (req.session.user_id) return next();
  res.status(401).json({ status: 'error', message: 'Unauthorized' });
};

const isAdmin = (req, res, next) => {
  if (req.session.role === 'admin') return next();
  res.status(403).json({ status: 'error', message: 'Forbidden: Admin only' });
};

const isOwner = (req, res, next) => {
  if (req.session.role === 'owner') return next();
  res.status(403).json({ status: 'error', message: 'Forbidden: Owner only' });
};

// Auth routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) return res.json({ status: 'error', message: 'Invalid username' });
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ status: 'error', message: 'Invalid password' });
    req.session.user_id = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    res.json({ status: 'success', role: user.role });
  });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ status: 'success' });
});

app.post('/api/register', async (req, res) => {
  const { username, password, role = 'owner' } = req.body;
  connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length > 0) return res.json({ status: 'error', message: 'Username exists' });
    const hashed = await bcrypt.hash(password, 10);
    connection.query('INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, NOW())', [username, hashed, role], (err) => {
      if (err) return res.json({ status: 'error', message: 'Error registering' });
      res.json({ status: 'success' });
    });
  });
});

app.post('/api/password_reset', (req, res) => {
  const { username } = req.body;
  connection.query('SELECT id, email FROM users WHERE username = ?', [username], (err, results) => {
    if (err || results.length === 0) return res.json({ status: 'error', message: 'Username not found' });
    const user = results[0];
    const token = crypto.randomBytes(20).toString('hex');
    const expiry = new Date(Date.now() + 3600000);
    connection.query('UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?', [token, expiry, user.id], (err) => {
      if (err) return res.json({ status: 'error', message: 'Error generating token' });
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: 'your_email@gmail.com', pass: 'your_app_password' }
      });
      const mailOptions = {
        from: 'your_email@gmail.com',
        to: user.email,
        subject: 'Password Reset',
        text: `Click to reset: http://localhost:3000/reset_password.html?token=${token}`
      };
      transporter.sendMail(mailOptions, (error) => {
        if (error) return res.json({ status: 'error', message: 'Email failed' });
        res.json({ status: 'success' });
      });
    });
  });
});

app.post('/api/reset_password', async (req, res) => {
  const { token, new_password } = req.body;
  connection.query('SELECT id FROM users WHERE reset_token = ? AND reset_expiry > NOW()', [token], async (err, results) => {
    if (err || results.length === 0) return res.json({ status: 'error', message: 'Invalid or expired token' });
    const userId = results[0].id;
    const hashed = await bcrypt.hash(new_password, 10);
    connection.query('UPDATE users SET password = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?', [hashed, userId], (err) => {
      if (err) return res.json({ status: 'error', message: 'Error resetting password' });
      res.json({ status: 'success' });
    });
  });
});

app.get('/api/products', isLoggedIn, (req, res) => {
  connection.query('SELECT * FROM products ORDER BY created_at DESC', (err, results) => {
    if (err) return res.json({ status: 'error' });
    res.json(results);
  });
});

app.post('/api/products', isOwner, (req, res) => {
  const { product_name, description, category, price, stock } = req.body;
  connection.query('INSERT INTO products (product_name, description, category, price, stock, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [product_name, description, category, price, stock], (err) => {
    if (err) return res.json({ status: 'error' });
    res.json({ status: 'success' });
  });
});

app.get('/api/customers', isOwner, (req, res) => {
  connection.query('SELECT * FROM customers ORDER BY created_at DESC', (err, results) => {
    if (err) return res.json({ status: 'error' });
    res.json(results);
  });
});

app.post('/api/customers', isOwner, (req, res) => {
  const { customer_name, contact_info } = req.body;
  connection.query('INSERT INTO customers (customer_name, contact_info, created_at) VALUES (?, ?, NOW())', [customer_name, contact_info], (err) => {
    if (err) return res.json({ status: 'error' });
    res.json({ status: 'success' });
  });
});

app.get('/api/users', isAdmin, (req, res) => {
  connection.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC', (err, results) => {
    if (err) return res.json({ status: 'error' });
    res.json(results);
  });
});

app.post('/api/users', isAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length > 0) return res.json({ status: 'error', message: 'Username exists' });
    const hashed = await bcrypt.hash(password, 10);
    connection.query('INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, NOW())', [username, hashed, role], (err) => {
      if (err) return res.json({ status: 'error' });
      res.json({ status: 'success' });
    });
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));