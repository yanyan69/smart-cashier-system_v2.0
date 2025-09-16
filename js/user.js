document.addEventListener('DOMContentLoaded', function() {
    // Dashboard
    const dashboardWidgets = document.querySelector('.dashboard-widgets');
    if (dashboardWidgets) {
        fetch('/api/products')
            .then(res => {
                const lowStock = res.headers.get('X-Low-Stock');
                if (lowStock) {
                    const lowStockItems = JSON.parse(lowStock);
                    const lowStockWidget = dashboardWidgets.querySelector('.widget:last-child ul');
                    lowStockWidget.innerHTML = lowStockItems.length > 0 
                        ? lowStockItems.map(item => `<li>${item}</li>`).join('')
                        : '<li>No low stock items</li>';
                }
                return res.json();
            })
            .catch(() => window.displayMessage('Error loading dashboard', 'danger'));
    }

    // Products
    const productsTable = document.getElementById('productsTable');
    if (productsTable) {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    data.forEach(product => {
                        const row = productsTable.insertRow();
                        row.innerHTML = `
                            <td>${product.product_name}</td>
                            <td>${product.description}</td>
                            <td>${product.category}</td>
                            <td>${product.price}</td>
                            <td>${product.stock}</td>
                            <td>
                                <button onclick="editProduct(${product.id}, '${product.product_name}', '${product.description}', '${product.category}', ${product.price}, ${product.stock})">Edit</button>
                                <button onclick="deleteProduct(${product.id})">Delete</button>
                            </td>
                        `;
                    });
                } else {
                    window.displayMessage('Error loading products', 'danger');
                }
            });
    }

    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(addProductForm);
            const data = Object.fromEntries(formData);
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            window.displayMessage(result.status === 'success' ? 'Product added' : 'Error: ' + result.message, result.status === 'success' ? 'success' : 'danger');
            if (result.status === 'success') addProductForm.reset();
        });
    }

    window.editProduct = async (id, name, desc, cat, price, stock) => {
        const form = document.getElementById('addProductForm');
        form.querySelector('#product_name').value = name;
        form.querySelector('#description').value = desc;
        form.querySelector('#category').value = cat;
        form.querySelector('#price').value = price;
        form.querySelector('#stock').value = stock;
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            window.displayMessage(result.status === 'success' ? 'Product updated' : 'Error: ' + result.message, result.status === 'success' ? 'success' : 'danger');
            if (result.status === 'success') window.location.reload();
        };
    };

    window.deleteProduct = async (id) => {
        if (confirm('Delete this product?')) {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await res.json();
            window.displayMessage(result.status === 'success' ? 'Product deleted' : 'Error: ' + result.message, result.status === 'success' ? 'success' : 'danger');
            if (result.status === 'success') window.location.reload();
        }
    };

    // Customers
    const customersTable = document.getElementById('customersTable');
    if (customersTable) {
        fetch('/api/customers')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    data.forEach(customer => {
                        const row = customersTable.insertRow();
                        row.innerHTML = `
                            <td>${customer.customer_name}</td>
                            <td>${customer.contact_info}</td>
                            <td>
                                <button onclick="editCustomer(${customer.id}, '${customer.customer_name}', '${customer.contact_info}')">Edit</button>
                            </td>
                        `;
                    });
                } else {
                    window.displayMessage('Error loading customers', 'danger');
                }
            });
    }

    const addCustomerForm = document.getElementById('addCustomerForm');
    if (addCustomerForm) {
        addCustomerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(addCustomerForm);
            const data = Object.fromEntries(formData);
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            window.displayMessage(result.status === 'success' ? 'Customer added' : 'Error: ' + result.message, result.status === 'success' ? 'success' : 'danger');
            if (result.status === 'success') addCustomerForm.reset();
        });
    }

    window.editCustomer = async (id, name, contact) => {
        const form = document.getElementById('addCustomerForm');
        form.querySelector('#customer_name').value = name;
        form.querySelector('#contact_info').value = contact;
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            const res = await fetch(`/api/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            window.displayMessage(result.status === 'success' ? 'Customer updated' : 'Error: ' + result.message, result.status === 'success' ? 'success' : 'danger');
            if (result.status === 'success') window.location.reload();
        };
    };

    // Sales
    const salesForm = document.getElementById('salesForm');
    if (salesForm) {
        let itemCount = 1;
        const saleItems = document.getElementById('saleItems');
        const addItem = document.getElementById('addItem');
        const paymentType = document.getElementById('payment_type');
        const creditDetails = document.getElementById('creditDetails');
        const totalAmount = document.getElementById('total_amount');

        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const select = saleItems.querySelector('.product-select');
                    data.forEach(product => {
                        const option = document.createElement('option');
                        option.value = product.id;
                        option.dataset.price = product.price;
                        option.textContent = `${product.product_name} (₱${product.price} - Stock: ${product.stock})`;
                        select.appendChild(option);
                    });
                }
            });

        fetch('/api/customers')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const select = document.getElementById('customer_id');
                    data.forEach(customer => {
                        const option = document.createElement('option');
                        option.value = customer.id;
                        option.textContent = customer.customer_name;
                        select.appendChild(option);
                    });
                }
            });

        addItem.addEventListener('click', () => {
            itemCount++;
            const newItem = saleItems.firstChild.cloneNode(true);
            newItem.querySelectorAll('select, input').forEach(el => {
                el.id = el.id.replace(/_\d+$/, `_${itemCount}`);
                el.name = el.name.replace(/\[\d+\]/, `[${itemCount}]`);
                if (el.type === 'number') el.value = 1;
                if (el.tagName === 'SELECT') el.selectedIndex = 0;
            });
            saleItems.appendChild(newItem);
            calculateTotal();
        });

        saleItems.addEventListener('change', calculateTotal);

        paymentType.addEventListener('change', () => {
            creditDetails.style.display = paymentType.value === 'credit' ? 'block' : 'none';
        });

        function calculateTotal() {
            let total = 0;
            saleItems.querySelectorAll('.sale-item').forEach(item => {
                const select = item.querySelector('.product-select');
                const qty = item.querySelector('.quantity-input');
                const price = parseFloat(select.options[select.selectedIndex]?.dataset.price) || 0;
                total += price * (parseInt(qty.value) || 0);
            });
            totalAmount.value = total.toFixed(2);
        }

        salesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(salesForm);
            const data = {
                customer_id: formData.get('customer_id') || null,
                payment_type: formData.get('payment_type'),
                total_amount: formData.get('total_amount'),
                items: []
            };
            formData.forEach((value, key) => {
                if (key.startsWith('items')) {
                    const match = key.match(/items\[(\d+)\]\[(\w+)\]/);
                    if (match) {
                        const index = parseInt(match[1]);
                        const field = match[2];
                        if (!data.items[index]) data.items[index] = {};
                        data.items[index][field] = value;
                        if (field === 'product_id') {
                            const select = document.querySelector(`select[name="items[${index}][product_id]"]`);
                            data.items[index].price_at_sale = parseFloat(select.options[select.selectedIndex].dataset.price);
                        }
                    }
                }
            });
            data.items = data.items.filter(item => item);
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            window.displayMessage(result.status === 'success' ? 'Sale recorded' : 'Error: ' + result.message, result.status === 'success' ? 'success' : 'danger');
            if (result.status === 'success') salesForm.reset();
        });
    }

    // Credits
    const creditsTable = document.getElementById('creditsTable');
    if (creditsTable) {
        fetch('/api/credits')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    data.forEach(credit => {
                        const row = creditsTable.insertRow();
                        row.innerHTML = `
                            <td>${credit.customer_name || 'N/A'}</td>
                            <td>${credit.total_amount}</td>
                            <td>${credit.created_at}</td>
                            <td>
                                <button onclick="payCredit(${credit.id}, ${credit.total_amount})">Pay</button>
                            </td>
                        `;
                    });
                } else {
                    window.displayMessage('Error loading credits', 'danger');
                }
            });
    }

    window.payCredit = async (saleId, amount) => {
        const payment = prompt(`Enter payment amount for credit (remaining: ₱${amount}):`, '0');
        if (payment && !isNaN(payment) && parseFloat(payment) > 0) {
            const res = await fetch('/api/credits/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sale_id: saleId, amount: parseFloat(payment) })
            });
            const result = await res.json();
            window.displayMessage(result.status === 'success' ? 'Payment recorded' : 'Error: ' + result.message, result.status === 'success' ? 'success' : 'danger');
            if (result.status === 'success') window.location.reload();
        }
    };

    // Reports
    const reportsForm = document.getElementById('reportsForm');
    const reportsTable = document.getElementById('reportsTable');
    if (reportsForm && reportsTable) {
        reportsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const period = reportsForm.querySelector('#period').value;
            const res = await fetch(`/api/reports?period=${period}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                reportsTable.querySelector('tbody').innerHTML = '';
                data.forEach(report => {
                    const row = reportsTable.insertRow();
                    if (period === 'daily') {
                        row.innerHTML = `<td>${report.date}</td><td>${report.total}</td>`;
                    } else if (period === 'weekly') {
                        row.innerHTML = `<td>Week ${report.week}</td><td>${report.total}</td>`;
                    } else if (period === 'monthly') {
                        row.innerHTML = `<td>${report.month}/${report.year}</td><td>${report.total}</td>`;
                    }
                });
            } else {
                window.displayMessage('Error generating report', 'danger');
            }
        });
    }
});