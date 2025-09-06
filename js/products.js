document.addEventListener('DOMContentLoaded', function() {
    const productsTable = document.getElementById('productsTable');
    if (productsTable) {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    data.forEach(product => {
                        const row = productsTable.insertRow();
                        row.innerHTML = `<td>${product.product_name}</td><td>${product.description}</td><td>${product.category}</td><td>${product.price}</td><td>${product.stock}</td>`;
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
        });
    }
});