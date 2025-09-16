document.addEventListener('DOMContentLoaded', function() {
    const guestContent = document.getElementById('guestContent');
    if (!guestContent) return;

    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') || 'login';
    const success = urlParams.get('success');

    if (success) window.displayMessage(success, 'success');

    const sections = {
        login: `
            <h2>Welcome! Please Login</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" class="button">Login</button>
                <p>Don't have an account? <a href="/index.html?section=register">Register here.</a></p>
                <p>Forgot your password? <a href="/index.html?section=password_reset">Click here.</a></p>
            </form>
        `,
        register: `
            <h2>Register</h2>
            <form id="registerForm">
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" required>
                </div>
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" class="button">Register</button>
                <p><a href="/index.html?section=login">Already have an account? Login here.</a></p>
            </form>
        `,
        password_reset: `
            <h2>Password Reset</h2>
            <form id="passwordResetForm">
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" required>
                </div>
                <button type="submit" class="button">Reset Password</button>
                <p><a href="/index.html?section=login">Back to Login</a></p>
            </form>
            <p class="note">Note: A reset link will be sent to your registered email.</p>
        `,
        reset_password: `
            <h2>Reset Your Password</h2>
            <form id="resetPasswordForm">
                <div class="form-group">
                    <label for="new_password">New Password:</label>
                    <input type="password" id="new_password" required>
                </div>
                <div class="form-group">
                    <label for="confirm_password">Confirm New Password:</label>
                    <input type="password" id="confirm_password" required>
                </div>
                <button type="submit" class="button">Reset Password</button>
            </form>
        `,
        about_us: `
            <h2>About Us</h2>
            <p>Welcome to Techlaro, your trusted partner in business management solutions.</p>
            <p><a href="/index.html?section=login">Back to Login</a></p>
        `,
        unauthorized: `
            <h2>Unauthorized</h2>
            <p>You do not have permission to access this page.</p>
            <p><a href="/index.html?section=login">Back to Login</a></p>
        `
    };

    guestContent.innerHTML = sections[section] || sections.login;

    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.status === 'success') {
                sessionStorage.setItem('role', data.role);
                window.location.href = data.role === 'admin' ? '/admin/admin_panel.html' : '/user/dashboard.html';
            } else {
                window.displayMessage('Login failed: ' + data.message, 'danger');
            }
        });
    }

    // Register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (data.status === 'success') {
                window.location.href = '/index.html?section=login&success=Registered successfully';
            } else {
                window.displayMessage('Registration failed: ' + data.message, 'danger');
            }
        });
    }

    // Password Reset Request
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

    // Reset Password
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
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
                window.location.href = '/index.html?section=login&success=Password reset successfully';
            } else {
                window.displayMessage('Error: ' + data.message, 'danger');
            }
        });
    }
});