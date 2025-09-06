document.addEventListener('DOMContentLoaded', function() {
    const passwordResetForm = document.getElementById('passwordResetForm');
    if (passwordResetForm) {
        passwordResetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const res = await fetch('/api/password_reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            window.displayMessage(data.status === 'success' ? 'Reset email sent' : 'Error: ' + data.message, data.status === 'success' ? 'success' : 'danger');
        });
    }
});