from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('owner', 'admin'), default='owner')
    reset_token = db.Column(db.String(255))
    reset_expiry = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    price = db.Column(db.Numeric(10, 2), nullable=False)
    stock = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    contact_info = db.Column(db.String(100))
    total_purchases = db.Column(db.Numeric(10, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'))
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_type = db.Column(db.Enum('cash', 'credit'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    customer = db.relationship('Customer', backref='sales')

class SaleItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_sale = db.Column(db.Numeric(10, 2), nullable=False)
    sale = db.relationship('Sale', backref='items')
    product = db.relationship('Product', backref='sale_items')

class Credit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=False)
    amount_owed = db.Column(db.Numeric(10, 2), nullable=False)
    amount_paid = db.Column(db.Numeric(10, 2), default=0)
    status = db.Column(db.Enum('unpaid', 'partially_paid', 'paid'), default='unpaid')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    customer = db.relationship('Customer', backref='credits')
    sale = db.relationship('Sale', backref='credit')

class Log(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)