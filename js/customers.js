document.addEventListener('DOMContentLoaded', function() {
    const customersTable = document.getElementById('customersTable');
    if (customersTable) {
        fetch('/api/customers')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    data.forEach(customer => {
                        const row = customersTable.insertRow();
                        row.innerHTML = `<td>${customer.customer_name}</td><td>${customer.contact_info}</td>`;
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
        });
    }
});