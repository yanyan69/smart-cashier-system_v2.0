document.addEventListener('DOMContentLoaded', function() {
    const salesForm = document.getElementById('salesForm');
    if (salesForm) {
        let itemCount = 1;
        const saleItems = document.getElementById('saleItems');
        const addItem = document.getElementById('addItem');
        const paymentType = document.getElementById('payment_type');
        const creditDetails = document.getElementById('creditDetails');
        const totalAmount = document.getElementById('total_amount');

        // Populate products and customers
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
            const data = Object.fromEntries(formData);
            // Implement /api/sales endpoint in server.js
            window.displayMessage('Sale processed (implement API)', 'success');
        });
    }
});