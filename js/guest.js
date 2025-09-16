document.addEventListener('DOMContentLoaded', function() {
    const guestContent = document.getElementById('guestContent');
    if (!guestContent) return;

    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') || 'login';
    const success = urlParams.get('success');

    if (success) window.displayMessage(success, 'success');

    // HTML content for guest interfaces is stored here to consolidate into a single index.html
    // for GitHub Pages compatibility. Each section (login, register, about_us, etc.) is injected
    // dynamically based on the ?section query parameter, replacing separate PHP files.
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
            <h2>About Us - Techlaro Company</h2>
            <div class="company-overview">
                <h3>Our Company</h3>
                <p>Techlaro Company is a dynamic and innovative technology firm dedicated to providing cutting-edge solutions to meet the evolving needs of our clients. Founded on the principles of collaboration, expertise, and a passion for technology, we strive to deliver high-quality services and products that empower businesses and individuals alike. Our team of skilled professionals brings together a wealth of experience in various aspects of software development and database management.</p>
                <h3>Our Mission</h3>
                <p>To empower our clients with robust and scalable technology solutions through collaboration, innovation, and unwavering commitment to excellence.</p>
                <h3>Our Vision</h3>
                <p>To be a leading technology company recognized for its expertise, customer-centric approach, and contribution to technological advancement.</p>
                <h3>Our Core Values</h3>
                <ul>
                    <li><strong>Collaboration:</strong> We believe in the power of teamwork and open communication.</li>
                    <li><strong>Innovation:</strong> We are committed to exploring and implementing the latest technologies.</li>
                    <li><strong>Excellence:</strong> We strive for the highest standards in everything we do.</li>
                    <li><strong>Integrity:</strong> We conduct our business with honesty and transparency.</li>
                    <li><strong>Customer Focus:</strong> Our clients' success is our top priority.</li>
                </ul>
            </div>
            <h3>Our Team</h3>
            <div class="team-members">
                <div class="team-member">
                    <img src="/images/christian.jpg" alt="Christian L. Narvaez">
                    <h4>Christian L. Narvaez</h4>
                    <p>Full-Stack Developer</p>
                </div>
                <div class="team-member">
                    <img src="/images/johnpaul.jpg" alt="John Paul F. Armenta">
                    <h4>John Paul F. Armenta</h4>
                    <p>Back-end Developer</p>
                </div>
                <div class="team-member">
                    <img src="/images/jerald.jpg" alt="Jerald James D. Preclaro">
                    <h4>Jerald James D. Preclaro</h4>
                    <p>Front-end Developer</p>
                </div>
                <div class="team-member">
                    <img src="/images/marielle.jpg" alt="Marielle B. Maming">
                    <h4>Marielle B. Maming</h4>
                    <p>Database Administrator</p>
                </div>
            </div>
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
            const res = await fetch('/api/login', { // Update to Railway URL for production
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