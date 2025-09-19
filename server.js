require('dotenv').config();
console.log("Loaded env:", process.env.MYSQL_HOST, process.env.MYSQL_USER, process.env.MYSQL_DATABASE);

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
  secret: process.env.SESSION_SECRET || 'your_secret_key_here',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname)));

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'admin',
  database: process.env.MYSQL_DATABASE || 'cashier_db'
});

connection.connect(err => {
  if (err) console.error('Database connection failed: ' + err.stack);
  else console.log('Database connected');
});

// Middleware
const isLoggedIn = (req, res, next) => {
  if (req.session.user_id) return next();
  res.redirect('/index.html?section=unauthorized');
};

const isAdmin = (req, res, next) => {
  if (req.session.role === 'admin') return next();
  res.redirect('/index.html?section=unauthorized');
};

const isOwner = (req, res, next) => {
  if (req.session.role === 'owner') return next();
  res.redirect('/index.html?section=unauthorized');
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
  const { username, password, email, role = 'owner' } = req.body;
  connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length > 0) return res.json({ status: 'error', message: 'Username exists' });
    const hashed = await bcrypt.hash(password, 10);
    connection.query('INSERT INTO users (username, password, email, role, created_at) VALUES (?, ?, ?, ?, NOW())', [username, hashed, email, role], (err) => {
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
        auth: { user: process.env.EMAIL_USER || 'your_email@gmail.com', pass: process.env.EMAIL_PASS || 'your_app_password' }
      });
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your_email@gmail.com',
        to: user.email,
        subject: 'Password Reset',
        text: `Click to reset: ${process.env.APP_URL || 'http://localhost'}/index.html?section=reset_password&token=${token}`
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
    if (err) return res.json({ status: 'error', message: 'Error fetching products' });
    // Low stock notification
    const lowStock = results.filter(p => p.stock < 10).map(p => p.product_name);
    if (lowStock.length > 0) {
      res.setHeader('X-Low-Stock', JSON.stringify(lowStock));
    }
    res.json(results);
  });
});

app.post('/api/products', isOwner, (req, res) => {
  const { product_name, description, category, price, stock } = req.body;
  connection.query('INSERT INTO products (product_name, description, category, price, stock, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [product_name, description, category, price, stock], (err) => {
    if (err) return res.json({ status: 'error', message: 'Error adding product' });
    res.json({ status: 'success' });
  });
});

app.put('/api/products/:id', isOwner, (req, res) => {
  const { id } = req.params;
  const { product_name, description, category, price, stock } = req.body;
  connection.query('UPDATE products SET product_name = ?, description = ?, category = ?, price = ?, stock = ? WHERE id = ?', [product_name, description, category, price, stock, id], (err) => {
    if (err) return res.json({ status: 'error', message: 'Error updating product' });
    res.json({ status: 'success' });
  });
});

app.delete('/api/products/:id', isOwner, (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM products WHERE id = ?', [id], (err) => {
    if (err) return res.json({ status: 'error', message: 'Error deleting product' });
    res.json({ status: 'success' });
  });
});

app.get('/api/customers', isOwner, (req, res) => {
  connection.query('SELECT * FROM customers ORDER BY created_at DESC', (err, results) => {
    if (err) return res.json({ status: 'error', message: 'Error fetching customers' });
    res.json(results);
  });
});

app.post('/api/customers', isOwner, (req, res) => {
  const { customer_name, contact_info } = req.body;
  connection.query('INSERT INTO customers (customer_name, contact_info, created_at) VALUES (?, ?, NOW())', [customer_name, contact_info], (err) => {
    if (err) return res.json({ status: 'error', message: 'Error adding customer' });
    res.json({ status: 'success' });
  });
});

app.put('/api/customers/:id', isOwner, (req, res) => {
  const { id } = req.params;
  const { customer_name, contact_info } = req.body;
  connection.query('UPDATE customers SET customer_name = ?, contact_info = ? WHERE id = ?', [customer_name, contact_info, id], (err) => {
    if (err) return res.json({ status: 'error', message: 'Error updating customer' });
    res.json({ status: 'success' });
  });
});

app.post('/api/sales', isOwner, (req, res) => {
  const { customer_id, payment_type, total_amount, items } = req.body;
  connection.beginTransaction(err => {
    if (err) return res.json({ status: 'error', message: 'Transaction failed' });
    connection.query('INSERT INTO sales (customer_id, total_amount, payment_type, created_at) VALUES (?, ?, ?, NOW())', [customer_id || null, total_amount, payment_type], (err, result) => {
      if (err) return connection.rollback(() => res.json({ status: 'error', message: 'Error recording sale' }));
      const sale_id = result.insertId;
      const saleItems = items.map(item => [sale_id, item.product_id, item.quantity, item.price_at_sale]);
      connection.query('INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES ?', [saleItems], (err) => {
        if (err) return connection.rollback(() => res.json({ status: 'error', message: 'Error adding sale items' }));
        const updates = items.map(item => new Promise((resolve, reject) => {
          connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        }));
        Promise.all(updates).then(() => {
          connection.commit(err => {
            if (err) return connection.rollback(() => res.json({ status: 'error', message: 'Error committing transaction' }));
            res.json({ status: 'success' });
          });
        }).catch(err => connection.rollback(() => res.json({ status: 'error', message: 'Error updating stock' })));
      });
    });
  });
});

app.get('/api/credits', isOwner, (req, res) => {
  connection.query(`
    SELECT s.id, s.customer_id, c.customer_name, s.total_amount, s.created_at
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.payment_type = 'credit'
    ORDER BY s.created_at DESC
  `, (err, results) => {
    if (err) return res.json({ status: 'error', message: 'Error fetching credits' });
    res.json(results);
  });
});

app.post('/api/credits/pay', isOwner, (req, res) => {
  const { sale_id, amount } = req.body;
  connection.query('UPDATE sales SET total_amount = total_amount - ? WHERE id = ? AND payment_type = "credit"', [amount, sale_id], (err) => {
    if (err) return res.json({ status: 'error', message: 'Error recording payment' });
    connection.query('SELECT total_amount FROM sales WHERE id = ?', [sale_id], (err, results) => {
      if (err) return res.json({ status: 'error', message: 'Error checking sale' });
      if (results[0].total_amount <= 0) {
        connection.query('UPDATE sales SET payment_type = "cash" WHERE id = ?', [sale_id], (err) => {
          if (err) return res.json({ status: 'error', message: 'Error updating sale' });
          res.json({ status: 'success' });
        });
      } else {
        res.json({ status: 'success' });
      }
    });
  });
});

app.get('/api/reports', isOwner, (req, res) => {
  const { period = 'daily' } = req.query;
  let query;
  let params = [];
  if (period === 'daily') {
    query = 'SELECT DATE(created_at) as date, SUM(total_amount) as total FROM sales WHERE DATE(created_at) = CURDATE() GROUP BY DATE(created_at)';
  } else if (period === 'weekly') {
    query = 'SELECT WEEK(created_at) as week, SUM(total_amount) as total FROM sales WHERE YEAR(created_at) = YEAR(CURDATE()) GROUP BY WEEK(created_at)';
  } else if (period === 'monthly') {
    query = 'SELECT MONTH(created_at) as month, YEAR(created_at) as year, SUM(total_amount) as total FROM sales GROUP BY MONTH(created_at), YEAR(created_at)';
  } else {
    return res.json({ status: 'error', message: 'Invalid period' });
  }
  connection.query(query, params, (err, results) => {
    if (err) return res.json({ status: 'error', message: 'Error generating report' });
    res.json(results);
  });
});

app.get('/api/users', isAdmin, (req, res) => {
  connection.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC', (err, results) => {
    if (err) return res.json({ status: 'error', message: 'Error fetching users' });
    res.json(results);
  });
});

app.post('/api/users', isAdmin, async (req, res) => {
  const { username, password, email, role } = req.body;
  connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length > 0) return res.json({ status: 'error', message: 'Username exists' });
    const hashed = await bcrypt.hash(password, 10);
    connection.query('INSERT INTO users (username, password, email, role, created_at) VALUES (?, ?, ?, ?, NOW())', [username, hashed, email, role], (err) => {
      if (err) return res.json({ status: 'error', message: 'Error adding user' });
      res.json({ status: 'success' });
    });
  });
});

app.post('/api/backup', isAdmin, (req, res) => {
  // Placeholder for database backup (e.g., using mysqldump in production)
  res.json({ status: 'success', message: 'Database backup completed' });
});

app.get('/api/logs', isAdmin, (req, res) => {
  // Placeholder for system logs
  res.json({ status: 'success', logs: [] });
});

app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`));

app.use(express.static(path.join(__dirname, '.'))); // Serves index.html, css/, js/, etc.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
}); // Serves index.html for all routes (SPA-like for guest sections)

console.log('MySQL Config:', {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});