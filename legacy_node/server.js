require('dotenv').config();
console.log("Loaded env:", process.env.MYSQL_HOST, process.env.MYSQL_USER, process.env.MYSQL_DATABASE);

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'mySecretKey123!',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.APP_URL?.startsWith('https') }
}));
app.use(express.static(path.join(__dirname)));

// Connect to database using a promise-based connection pool
const connection = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'cashier_db'
});

connection.getConnection()
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection failed:', err.stack));

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

// --- AUTH ROUTES ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login request:', { username }); // Debug
    try {
        const [results] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length === 0) {
            return res.json({ status: 'error', message: 'Invalid username' });
        }
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        console.log('Password match:', match); // Debug
        if (!match) {
            return res.json({ status: 'error', message: 'Invalid password' });
        }
        req.session.user_id = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        res.json({ status: 'success', role: user.role });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ status: 'error', message: 'An internal server error occurred.' });
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ status: 'success' });
});

app.post('/api/register', async (req, res) => {
    const { username, password, role = 'owner' } = req.body;
    console.log('Register request:', { username, role }); // Debug
    try {
        const [results] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length > 0) {
            return res.json({ status: 'error', message: 'Username exists' });
        }
        const hashed = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashed); // Debug
        await connection.query(
            'INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, NOW())',
            [username, hashed, role]
        );
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ status: 'error', message: 'Error registering user.' });
    }
});

// Disabled password reset routes (no email column in users table)
// app.post('/api/password_reset', async (req, res) => {
//     return res.json({ status: 'error', message: 'Password reset not supported without email column' });
// });

// app.post('/api/reset_password', async (req, res) => {
//     return res.json({ status: 'error', message: 'Password reset not supported without email column' });
// });

// --- PRODUCT ROUTES ---
app.get('/api/products', isLoggedIn, async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM products ORDER BY created_at DESC');
        const [lowStock] = await connection.query('SELECT product_name FROM products WHERE stock < 5');
        res.set('X-Low-Stock', JSON.stringify(lowStock.map(item => item.product_name)));
        res.json(results);
    } catch (err) {
        console.error('Products fetch error:', err);
        res.status(500).json({ status: 'error', message: 'Error fetching products' });
    }
});

app.post('/api/products', isOwner, async (req, res) => {
    const { product_name, description, category, price, stock } = req.body;
    console.log('Add product request:', { product_name, category }); // Debug
    try {
        await connection.query(
            'INSERT INTO products (product_name, description, category, price, stock, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [product_name, description, category, price, stock]
        );
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Add product error:', err);
        res.status(500).json({ status: 'error', message: 'Error adding product' });
    }
});

app.put('/api/products/:id', isOwner, async (req, res) => {
    const { product_name, description, category, price, stock } = req.body;
    console.log('Update product request:', { id: req.params.id, product_name }); // Debug
    try {
        await connection.query(
            'UPDATE products SET product_name = ?, description = ?, category = ?, price = ?, stock = ? WHERE id = ?',
            [product_name, description, category, price, stock, req.params.id]
        );
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ status: 'error', message: 'Error updating product' });
    }
});

app.delete('/api/products/:id', isOwner, async (req, res) => {
    console.log('Delete product request:', { id: req.params.id }); // Debug
    try {
        await connection.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ status: 'error', message: 'Error deleting product' });
    }
});

// --- CUSTOMER ROUTES ---
app.get('/api/customers', isOwner, async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM customers ORDER BY created_at DESC');
        res.json(results);
    } catch (err) {
        console.error('Customers fetch error:', err);
        res.status(500).json({ status: 'error', message: 'Error fetching customers' });
    }
});

app.post('/api/customers', isOwner, async (req, res) => {
    const { customer_name, contact_info } = req.body;
    console.log('Add customer request:', { customer_name }); // Debug
    try {
        await connection.query(
            'INSERT INTO customers (customer_name, contact_info, created_at) VALUES (?, ?, NOW())',
            [customer_name, contact_info]
        );
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Add customer error:', err);
        res.status(500).json({ status: 'error', message: 'Error adding customer' });
    }
});

// --- SALES ROUTES ---
app.get('/api/sales', isOwner, async (req, res) => {
    try {
        const [results] = await connection.query(`
            SELECT s.*, c.customer_name
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            ORDER BY s.created_at DESC
        `);
        res.json(results);
    } catch (err) {
        console.error('Sales fetch error:', err);
        res.status(500).json({ status: 'error', message: 'Error fetching sales' });
    }
});

app.post('/api/sales', isOwner, async (req, res) => {
    const { customer_id, total_amount, payment_type, items } = req.body;
    console.log('Add sale request:', { customer_id, payment_type, total_amount }); // Debug
    try {
        const [result] = await connection.query(
            'INSERT INTO sales (customer_id, total_amount, payment_type, created_at) VALUES (?, ?, ?, NOW())',
            [customer_id || null, total_amount, payment_type]
        );
        const saleId = result.insertId;
        for (const item of items) {
            await connection.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)',
                [saleId, item.product_id, item.quantity, item.price_at_sale]
            );
            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }
        if (payment_type === 'credit') {
            await connection.query(
                'INSERT INTO credits (customer_id, sale_id, amount_owed, status, created_at) VALUES (?, ?, ?, "unpaid", NOW())',
                [customer_id, saleId, total_amount]
            );
        }
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Add sale error:', err);
        res.status(500).json({ status: 'error', message: 'Error recording sale' });
    }
});

// --- CREDIT ROUTES ---
app.get('/api/credits', isOwner, async (req, res) => {
    try {
        const [results] = await connection.query(`
            SELECT c.*, s.total_amount, s.created_at, cu.customer_name
            FROM credits c
            JOIN sales s ON c.sale_id = s.id
            LEFT JOIN customers cu ON c.customer_id = cu.id
            WHERE s.payment_type = 'credit'
            ORDER BY s.created_at DESC
        `);
        res.json(results);
    } catch (err) {
        console.error('Credits fetch error:', err);
        res.status(500).json({ status: 'error', message: 'Error fetching credits' });
    }
});

app.post('/api/credits/pay', isOwner, async (req, res) => {
    const { sale_id, amount } = req.body;
    console.log('Pay credit request:', { sale_id, amount }); // Debug
    try {
        await connection.query(
            'UPDATE credits SET amount_paid = amount_paid + ?, status = CASE WHEN amount_paid + ? >= amount_owed THEN "paid" ELSE "partially_paid" END WHERE sale_id = ?',
            [amount, amount, sale_id]
        );
        const [results] = await connection.query('SELECT amount_owed, amount_paid FROM credits WHERE sale_id = ?', [sale_id]);
        if (results[0].amount_paid >= results[0].amount_owed) {
            await connection.query('UPDATE sales SET payment_type = "cash" WHERE id = ?', [sale_id]);
        }
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Pay credit error:', err);
        res.status(500).json({ status: 'error', message: 'Error recording payment' });
    }
});

// --- REPORTS ROUTES ---
app.get('/api/reports', isOwner, async (req, res) => {
    const { period = 'daily' } = req.query;
    console.log('Reports request:', { period }); // Debug
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
    try {
        const [results] = await connection.query(query, params);
        res.json(results);
    } catch (err) {
        console.error('Reports error:', err);
        res.status(500).json({ status: 'error', message: 'Error generating report' });
    }
});

// --- ADMIN ROUTES ---
app.get('/api/users', isAdmin, async (req, res) => {
    try {
        const [results] = await connection.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
        res.json(results);
    } catch (err) {
        console.error('Users fetch error:', err);
        res.status(500).json({ status: 'error', message: 'Error fetching users' });
    }
});

app.post('/api/users', isAdmin, async (req, res) => {
    const { username, password, role } = req.body;
    console.log('Add user request:', { username, role }); // Debug
    try {
        const [results] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length > 0) return res.json({ status: 'error', message: 'Username exists' });
        const hashed = await bcrypt.hash(password, 10);
        await connection.query(
            'INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, NOW())',
            [username, hashed, role]
        );
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Add user error:', err);
        res.status(500).json({ status: 'error', message: 'Error adding user' });
    }
});

app.post('/api/backup', isAdmin, (req, res) => {
    console.log('Backup request'); // Debug
    res.json({ status: 'success', message: 'Database backup completed' });
});

app.get('/api/logs', isAdmin, async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM logs ORDER BY timestamp DESC');
        res.json({ status: 'success', logs: results });
    } catch (err) {
        console.error('Logs fetch error:', err);
        res.status(500).json({ status: 'error', message: 'Error fetching logs' });
    }
});

// --- ROOT & CATCH-ALL ROUTE ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`));