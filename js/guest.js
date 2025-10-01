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
                    <label for="password">Password:</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" class="button">Register</button>
                <p><a href="/index.html?section=login">Already have an account? Login here.</a></p>
            </form>
        `,
        about_us: `
            <h2>About Us - Techlaro Company</h2>
            <div class="company-overview">
                <h3>Our Company</h3>
                <p>Techlaro Company is a dynamic and innovative technology firm dedicated to providing cutting-edge solutions to meet the evolving needs of our clients. Founded on the principles of collaboration, expertise, and a passion for technology, we strive to deliver high-quality services and products that empower businesses and individuals alike. Our team of skilled professionals brings together a wealth of experience in various aspects of software development and database management.</p>
                <h3>Our Mission</h3>
                <p>To empower our clients with robust and scalable technology solutions through collaboration, innovation, and unwavering commitment to excellence.</p>
                <h3>Our Vision</h3>
                <p>To be a leading technology partner, recognized globally for delivering transformative solutions that drive business success and foster sustainable growth.</p>
                <p><a href="/index.html?section=login">Back to Login</a></p>
            </div>
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
            const password = document.getElementById('password').value;
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.status === 'success') {
                window.location.href = '/index.html?section=login&success=Registered successfully';
            } else {
                window.displayMessage('Registration failed: ' + data.message, 'danger');
            }
        });
    }
});