Smart Business Cashier and Inventory Management System
Overview
This is a web-based system designed to help small businesses manage their sales, inventory, and customer credits ("utang"). It aims to replace manual tracking methods, reduce errors, and streamline operations for businesses like hardware stores and sari-sari stores.

Features
    - Product Management: Create, edit, delete products with details like name, description, category, price, and stock. Search and sort products.
    - Sales and Transaction Management: Record sales, specify quantities, automatically calculate totals, and generate itemized receipts. Supports cash and credit sales.
    - Credit Management ("Utang"): Assign sales to customers as credit, record amounts owed, track payments, and monitor credit statuses.
    - Customer Management: Create and update customer profiles with contact information and view their credit history and total purchases.
    - Order History and Reporting: Record all transactions, allow searching and filtering, and generate summarized reports for various periods.
    - Administrative Maintenance: Manage store owner accounts, perform database backups, and view system logs (Admin access only).
    - System Notifications: Automatic low stock alerts. Confirmation of database backups.
    - User-Friendly Interface: Simple and intuitive design for users with minimal technical background.
    - Multi-Device Access: Accessible on Windows PCs and Android devices via web browsers.

Technologies Used
    - HTML
    - CSS
    - JavaScript
    - Node.js
    - MySQL

Installation
    - Prerequisites: Ensure you have a web server environment with MySQL installed (e.g., XAMPP for local development). For Node.js, install from nodejs.org.
    - Database Setup:
        - Start MySQL server.
        - Access phpMyAdmin (usually at http://localhost/phpmyadmin).
        - Create a new database named cashier_db.
        - Import the database.sql file or manually create tables (e.g., users, products, customers, sales).
        - Update database connection in server.js if credentials differ (host: 'localhost', user: 'root', password: 'admin').
    - File Placement: Place the project in your web server's document root (e.g., htdocs/smart-cashier-system in XAMPP). Configure Apache to proxy /api to Node.js as previously described.
    - Node.js Setup: Run npm install in the project root to install dependencies.
    - Start the App: Run node server.js for the backend. Access frontend via Apache at http://localhost/index.html.

Getting Started
    - Navigate to http://localhost/index.html in your browser for the login page.
    - Register an initial user via register section (defaults to 'owner' role; admins can be added later).
    - Use phpMyAdmin to monitor or edit the database directly.