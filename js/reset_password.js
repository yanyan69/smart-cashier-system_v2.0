document.addEventListener('DOMContentLoaded', function() {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (!token) {
            window.displayMessage('Invalid reset link', 'danger');
            return;
        }
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const new_password = document.getElementById('new_password').value;
            const confirm_password = document.getElementById('confirm_password').value;
            if (new_password !== confirm_password) {
                window.displayMessage('Passwords do not match', 'danger');
                return;
            }
            const res = await fetch('/api/reset_password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password })
            });
            const data = await res.json();
            if (data.status === 'success') {
                window.location.href = '/index.html?success=Password reset successfully';
            } else {
                window.displayMessage('Error: ' + data.message, 'danger');
            }
        });
    }
});