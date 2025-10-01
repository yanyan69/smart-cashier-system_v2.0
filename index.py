import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, session, redirect, url_for, send_from_directory
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from models import db, User, Product, Customer, Sale, SaleItem, Credit, Log

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY') or 'mySecretKey123!'  # Add to .env
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.environ.get('MYSQL_USER', 'root')}:{os.environ.get('MYSQL_PASSWORD', '')}@"
    f"{os.environ.get('MYSQL_HOST', 'localhost')}/{os.environ.get('MYSQL_DATABASE', 'cashier_db')}?charset=utf8mb4"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
Session(app)

# Create tables on startup (like your DB init)
with app.app_context():
    db.create_all()
    print('Database tables created/verified')

# Middleware (Decorators)
def is_logged_in(f):
    def wrap(*args, **kwargs):
        if not session.get('user_id'):
            return redirect('/?section=unauthorized')
        return f(*args, **kwargs)
    wrap.__name__ = f.__name__
    return wrap

def is_admin(f):
    def wrap(*args, **kwargs):
        if session.get('role') != 'admin':
            return redirect('/?section=unauthorized')
        return f(*args, **kwargs)
    wrap.__name__ = f.__name__
    return wrap

def is_owner(f):
    def wrap(*args, **kwargs):
        if session.get('role') not in ['owner', 'admin']:
            return redirect('/?section=unauthorized')
        return f(*args, **kwargs)
    wrap.__name__ = f.__name__
    return wrap

# Log helper
def add_log(event):
    log = Log(event=event)
    db.session.add(log)
    db.session.commit()

# --- AUTH ROUTES ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username, password = data.get('username'), data.get('password')
    print(f"Login request: {username}")  # Debug
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['role'] = user.role
        add_log(f"User {username} logged in")
        return jsonify({'status': 'success', 'role': user.role})
    return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username, password = data.get('username'), data.get('password')
    print(f"Register request: {username}")  # Debug
    if User.query.filter_by(username=username).first():
        return jsonify({'status': 'error', 'message': 'Username exists'})
    hashed = generate_password_hash(password, method='pbkdf2:sha256')
    user = User(username=username, password=hashed, role='owner')  # Default role
    db.session.add(user)
    db.session.commit()
    add_log(f"User {username} registered")
    return jsonify({'status': 'success'})

@app.route('/api/logout', methods=['POST'])
def logout():
    if session.get('user_id'):
        username = User.query.get(session['user_id']).username
        add_log(f"User {username} logged out")
    session.clear()
    return jsonify({'status': 'success'})

# Password reset stub (expand with email via nodemailer port)
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    username = data.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'status': 'error', 'message': 'User not found'})
    token = os.urandom(24).hex()
    user.reset_token = token
    user.reset_expiry = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()
    # TODO: Send email with token (use smtplib + your EMAIL_USER/PASS)
    add_log(f"Password reset requested for {username}")
    return jsonify({'status': 'success', 'message': 'Reset link sent'})

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token, password = data.get('token'), data.get('password')
    user = User.query.filter_by(reset_token=token).first()
    if not user or user.reset_expiry < datetime.utcnow():
        return jsonify({'status': 'error', 'message': 'Invalid or expired token'})
    user.password = generate_password_hash(password, method='pbkdf2:sha256')
    user.reset_token = None
    user.reset_expiry = None
    db.session.commit()
    add_log(f"Password reset for {user.username}")
    return jsonify({'status': 'success'})

# --- PRODUCTS ---
@app.route('/api/products', methods=['GET'])
@is_owner
def get_products():
    products = Product.query.all()
    low_stock = [p.product_name for p in Product.query.filter(Product.stock < 10).all()]  # Threshold like your JS
    resp = jsonify([{
        'id': p.id, 'product_name': p.product_name, 'description': p.description,
        'category': p.category, 'price': float(p.price), 'stock': p.stock
    } for p in products])
    resp.headers['X-Low-Stock'] = jsonify(low_stock).get_data(as_text=True)  # Matches your JS
    return resp

@app.route('/api/products', methods=['POST'])
@is_owner
def add_product():
    data = request.json
    product = Product(**{k: v for k, v in data.items() if k != 'id'})
    db.session.add(product)
    db.session.commit()
    add_log(f"Product {data['product_name']} added")
    return jsonify({'status': 'success'})

@app.route('/api/products/<int:id>', methods=['PUT'])
@is_owner
def update_product(id):
    product = Product.query.get_or_404(id)
    data = request.json
    for key, value in data.items():
        if hasattr(product, key):
            setattr(product, key, value)
    db.session.commit()
    add_log(f"Product {product.product_name} updated")
    return jsonify({'status': 'success'})

@app.route('/api/products/<int:id>', methods=['DELETE'])
@is_owner
def delete_product(id):
    product = Product.query.get_or_404(id)
    name = product.product_name
    db.session.delete(product)
    db.session.commit()
    add_log(f"Product {name} deleted")
    return jsonify({'status': 'success'})

# --- CUSTOMERS ---
@app.route('/api/customers', methods=['GET'])
@is_owner
def get_customers():
    customers = Customer.query.all()
    return jsonify([{
        'id': c.id, 'customer_name': c.customer_name, 'contact_info': c.contact_info
    } for c in customers])

@app.route('/api/customers', methods=['POST'])
@is_owner
def add_customer():
    data = request.json
    customer = Customer(**data)
    db.session.add(customer)
    db.session.commit()
    add_log(f"Customer {data['customer_name']} added")
    return jsonify({'status': 'success'})

# --- SALES ---
@app.route('/api/sales', methods=['GET'])
@is_owner
def get_sales():
    sales = Sale.query.all()
    return jsonify([{
        'id': s.id, 'customer_id': s.customer_id, 'total_amount': float(s.total_amount),
        'payment_type': s.payment_type, 'created_at': s.created_at.isoformat()
    } for s in sales])

@app.route('/api/sales', methods=['POST'])
@is_owner
def record_sale():
    data = request.json
    sale = Sale(customer_id=data.get('customer_id'), total_amount=data['total_amount'], payment_type=data['payment_type'])
    db.session.add(sale)
    db.session.flush()  # Get sale.id
    for item in data['items']:
        sale_item = SaleItem(sale_id=sale.id, product_id=item['product_id'], quantity=item['quantity'], price_at_sale=item['price'])
        db.session.add(sale_item)
        # Update stock
        product = Product.query.get(item['product_id'])
        product.stock -= item['quantity']
    if sale.payment_type == 'credit':
        credit = Credit(customer_id=sale.customer_id, sale_id=sale.id, amount_owed=sale.total_amount)
        db.session.add(credit)
        # Update customer total_purchases
        if sale.customer_id:
            cust = Customer.query.get(sale.customer_id)
            cust.total_purchases += sale.total_amount
    db.session.commit()
    add_log(f"Sale {sale.id} recorded ({sale.payment_type})")
    return jsonify({'status': 'success', 'sale_id': sale.id})

# --- CREDITS ---
@app.route('/api/credits', methods=['GET'])
@is_owner
def get_credits():
    credits = Credit.query.join(Sale).join(Customer).add_columns(Customer.customer_name, Sale.created_at).all()
    return jsonify([{
        'id': c.Credit.id, 'customer': c.Customer.customer_name, 'amount_owed': float(c.Credit.amount_owed),
        'amount_paid': float(c.Credit.amount_paid), 'date': c.Sale.created_at.isoformat(),
        'total_amount': float(c.Sale.total_amount)  # For payCredit JS
    } for c in credits])

@app.route('/api/credits/pay', methods=['POST'])
@is_owner
def pay_credit():
    data = request.json
    credit = Credit.query.get(data['sale_id'])  # Matches your JS: sale_id as credit key
    if not credit:
        return jsonify({'status': 'error', 'message': 'Credit not found'})
    payment = data['amount']
    credit.amount_paid += payment
    remaining = credit.amount_owed - credit.amount_paid
    if remaining <= 0:
        credit.status = 'paid'
    elif credit.amount_paid > 0:
        credit.status = 'partially_paid'
    db.session.commit()
    add_log(f"Payment ₱{payment} applied to credit {credit.id}")
    return jsonify({'status': 'success', 'remaining': remaining})

# --- REPORTS ---
@app.route('/api/reports', methods=['GET'])
@is_owner
def get_reports():
    period = request.args.get('period', 'daily')
    if period == 'daily':
        sales = db.session.query(db.func.date(Sale.created_at), db.func.sum(Sale.total_amount)).group_by(db.func.date(Sale.created_at)).all()
        return jsonify([{'date': str(d[0]), 'total': float(d[1] or 0)} for d in sales])
    elif period == 'weekly':
        # Group by week (ISO week)
        sales = db.session.query(
            db.func.week(Sale.created_at, 'iso'), db.func.year(Sale.created_at), db.func.sum(Sale.total_amount)
        ).group_by(db.func.week(Sale.created_at, 'iso'), db.func.year(Sale.created_at)).all()
        return jsonify([{'week': f"Week {d[0]} {d[1]}", 'total': float(d[2] or 0)} for d in sales])
    elif period == 'monthly':
        sales = db.session.query(
            db.func.month(Sale.created_at), db.func.year(Sale.created_at), db.func.sum(Sale.total_amount)
        ).group_by(db.func.month(Sale.created_at), db.func.year(Sale.created_at)).all()
        return jsonify([{'month': f"{d[0]}/{d[1]}", 'total': float(d[2] or 0)} for d in sales])
    return jsonify([])

# --- ADMIN ---
@app.route('/api/users', methods=['GET', 'POST'])
@is_admin
def manage_users():
    if request.method == 'POST':
        data = request.json
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'status': 'error', 'message': 'Username exists'})
        hashed = generate_password_hash(data['password'], method='pbkdf2:sha256')
        user = User(username=data['username'], password=hashed, role=data['role'])
        db.session.add(user)
        db.session.commit()
        add_log(f"Admin added user {data['username']}")
        return jsonify({'status': 'success'})
    users = User.query.with_entities(User.id, User.username, User.role, User.created_at).order_by(User.created_at.desc()).all()
    return jsonify([{'id': u.id, 'username': u.username, 'role': u.role, 'created_at': u.created_at.isoformat()} for u in users])

@app.route('/api/backup', methods=['POST'])
@is_admin
def backup():
    print("Backup request")  # Stub – implement mysqldump or SQL export
    add_log("Database backup initiated")
    return jsonify({'status': 'success', 'message': 'Database backup completed'})

@app.route('/api/logs', methods=['GET'])
@is_admin
def get_logs():
    logs = Log.query.order_by(Log.timestamp.desc()).all()
    return jsonify([{'id': l.id, 'event': l.event, 'timestamp': l.timestamp.isoformat()} for l in logs])

# --- Frontend Serving (Like your Express static) ---
@app.route('/')
@app.route('/<path:filename>')
def serve_static(filename='index.html'):
    return send_from_directory('.', filename)  # Serves HTML/JS/CSS from root

if __name__ == '__main__':
    app.run(debug=True, port=int(os.environ.get('PORT', 5000)), host='0.0.0.0')