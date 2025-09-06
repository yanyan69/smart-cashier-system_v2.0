document.addEventListener('DOMContentLoaded', function() {
    const adminContent = document.getElementById('adminContent');
    if (adminContent) {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action') || 'overview';
        if (action === 'manage_users') {
            fetch('/api/users')
                .then(res => res.json())
                .then(data => {
                    let html = '<h2>Manage Users</h2><table class="table"><thead><tr><th>Username</th><th>Role</th><th>Created At</th></tr></thead><tbody>';
                    data.forEach(user => {
                        html += `<tr><td>${user.username}</td><td>${user.role}</td><td>${user.created_at}</td></tr>`;
                    });
                    html += '</tbody></table>';
                    adminContent.innerHTML = html;
                });
        } else if (action === 'overview') {
            adminContent.innerHTML = '<h2>Admin Overview</h2><p>Welcome to the admin panel.</p>';
        }
    }
});