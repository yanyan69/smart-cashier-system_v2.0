Smart Business Cashier and Inventory Management System
Overview
This is a web-based system designed to help small businesses manage their sales, inventory, and customer credits ("utang"). It aims to replace manual tracking methods, reduce errors, and streamline operations for businesses like hardware stores and sari-sari stores.
Features

Product Management: Create, edit, delete products with details like name, description, category, price, and stock. Search and sort products.
Sales and Transaction Management: Record sales, specify quantities, automatically calculate totals, and generate itemized receipts. Supports cash and credit sales.
Credit Management ("Utang"): Assign sales to customers as credit, record amounts owed, track payments, and monitor credit statuses.
Customer Management: Create and update customer profiles with contact information and view their credit history and total purchases.
Order History and Reporting: Record all transactions, allow searching and filtering, and generate summarized reports for various periods.
Administrative Maintenance: Manage store owner accounts, perform database backups, and view system logs (Admin access only).
System Notifications: Automatic low stock alerts. Confirmation of database backups.
User-Friendly Interface: Simple and intuitive design for users with minimal technical background.
Multi-Device Access: Accessible on Windows PCs and Android devices via web browsers.

Technologies Used

HTML
CSS
JavaScript
Python (Flask)
MySQL

Installation

Prerequisites: Ensure you have Python 3.8+ installed (from python.org). For MySQL, install a server like XAMPP or MariaDB for local development.
Database Setup:

Start your MySQL server.
Access phpMyAdmin (usually at http://localhost/phpmyadmin) or use a MySQL client.
Create a new database named cashier_db.
Run the database.sql script to create tables (e.g., users, products, customers, sales), or let the Flask app initialize them on first run.
Update database credentials in .env if they differ (e.g., MYSQL_HOST=localhost, MYSQL_USER=root, MYSQL_PASSWORD=your_password).


Python Dependencies: Run pip install -r requirements.txt in the project root to install Flask, SQLAlchemy, and other libraries.
Environment Setup: Copy the provided .env file and fill in your MySQL credentials and FLASK_SECRET_KEY (generate a strong random string).
Start the App: Run python app.py for the full-stack server (handles both backend API and frontend serving). Access the app at http://localhost:5000 (or your configured PORT).

Getting Started

Navigate to http://localhost:5000 in your browser for the login page.
Register an initial user via the register section (defaults to 'owner' role; admins can be added later via the Admin panel).
Use phpMyAdmin or a MySQL client to monitor or edit the database directly.

Legacy Node.js Version
The original Node.js backend has been backed up in /legacy-node/ for reference. This Flask port maintains full API compatibility for seamless frontend integration.
© 2025 Techlaro Company