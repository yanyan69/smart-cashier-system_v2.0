document.addEventListener('DOMContentLoaded', function() {
    const adminContent = document.getElementById('adminContent');
    if (adminContent) {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action') || 'overview';
        if (action === 'manage_users') {
            fetch('/api/users')
                .then(res => res.json())
                .then(data => {
                    let html = `
                        <h2>Manage Users</h2>
                        <form id="addUserForm" class="form-container">
                            <div class="form-group">
                                <label for="username">Username:</label>
                                <input type="text" id="username" name="username" required>
                            </div>
                            <div class="form-group">
                                <label for="password">Password:</label>
                                <input type="password" id="password" name="password" required>
                            </div>
                            <div class="form-group">
                                <label for="role">Role:</label>
                                <select id="role" name="role">
                                    <option value="owner">Owner</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" class="button">Add User</button>
                        </form>
                        <table class="table">
                            <thead><tr><th>Username</th><th>Role</th><th>Created At</th></tr></thead>
                            <tbody>
                    `;
                    data.forEach(user => {
                        html += `<tr><td>${user.username}</td><td>${user.role}</td><td>${user.created_at}</td></tr>`;
                    });
                    html += '</tbody></table>';
                    adminContent.innerHTML = html;

                    const addUserForm = document.getElementById('addUserForm');
                    if (addUserForm) {
                        addUserForm.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const formData = new FormData(addUserForm);
                            const data = Object.fromEntries(formData);
                            const res = await fetch('/api/users', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            });
                            const dataRes = await res.json();
                            window.displayMessage(dataRes.status === 'success' ? 'User added' : 'Error: ' + dataRes.message, dataRes.status === 'success' ? 'success' : 'danger');
                            if (dataRes.status === 'success') window.location.reload();
                        });
                    }
                });
        } else if (action === 'backup_db') {
            adminContent.innerHTML = `
                <h2>Database Backups</h2>
                <button id="backupBtn" class="button">Create Backup</button>
                <p id="backupStatus"></p>
            `;
            document.getElementById('backupBtn').addEventListener('click', async () => {
                const res = await fetch('/api/backup', { method: 'POST' });
                const result = await res.json();
                window.displayMessage(result.status === 'success' ? 'Backup completed' : 'Error: ' + result.message, result.status === 'success' ? 'success' : 'danger');
            });
        } else if (action === 'view_logs') {
            adminContent.innerHTML = '<h2>System Logs</h2><p>No logs available (implement server-side logging).</p>';
        } else {
            adminContent.innerHTML = '<h2>Admin Overview</h2><p>Welcome to the admin panel.</p>';
        }
    }
});