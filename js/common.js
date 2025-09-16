document.addEventListener('DOMContentLoaded', function() {
    // Display message
    window.displayMessage = function(message, type = 'info') {
        const messageContainer = document.createElement('div');
        messageContainer.textContent = message;
        messageContainer.classList.add('alert', `alert-${type}`);
        document.body.prepend(messageContainer);
        setTimeout(() => messageContainer.remove(), 3000);
    };

    // Load sidebar
    const sidebarContainer = document.querySelector('.sidebar-container');
    if (sidebarContainer) {
        fetch('/components/sidebar.html')
            .then(res => res.text())
            .then(html => {
                sidebarContainer.innerHTML = html;
                const navList = sidebarContainer.querySelector('.nav-list');
                const role = sessionStorage.getItem('role') || 'guest';
                const navItems = {
                    guest: [
                        { href: '/index.html?section=about_us', text: 'About Us' },
                        { href: '/index.html?section=login', text: 'Login' }
                    ],
                    owner: [
                        { href: '/user/dashboard.html', text: 'Dashboard' },
                        { href: '/user/products.html', text: 'Products' },
                        { href: '/user/sales.html', text: 'Sales' },
                        { href: '/user/credits.html', text: 'Credits' },
                        { href: '/user/customers.html', text: 'Customers' },
                        { href: '/user/reports.html', text: 'Reports' },
                        { href: '#', text: 'Logout', onclick: `fetch('/api/logout').then(() => window.location.href = '/index.html')` }
                    ],
                    admin: [
                        { href: '/admin/admin_panel.html?action=overview', text: 'Overview' },
                        { href: '/admin/admin_panel.html?action=manage_users', text: 'Manage Users' },
                        { href: '/admin/admin_panel.html?action=backup_db', text: 'Database Backups' },
                        { href: '/admin/admin_panel.html?action=view_logs', text: 'System Logs' },
                        { href: '#', text: 'Logout', onclick: `fetch('/api/logout').then(() => window.location.href = '/index.html')` }
                    ]
                };
                navList.innerHTML = navItems[role].map(item => 
                    `<li><a href="${item.href}" ${item.onclick ? `onclick="${item.onclick}"` : ''}>${item.text}</a></li>`
                ).join('');
                
                const toggleButton = sidebarContainer.querySelector('.toggle-button');
                const sidebar = sidebarContainer.querySelector('.sidebar');
                if (toggleButton && sidebar) {
                    toggleButton.addEventListener('click', () => {
                        sidebar.classList.toggle('open');
                        toggleButton.classList.toggle('active');
                    });
                }
            });
    }
});