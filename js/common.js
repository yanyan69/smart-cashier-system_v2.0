document.addEventListener('DOMContentLoaded', function() {
    console.log('common.js loaded');

    // Display message function
    window.displayMessage = function(message, type = 'info') {
        const messageContainer = document.createElement('div');
        messageContainer.textContent = message;
        messageContainer.classList.add('alert', `alert-${type}`);
        document.body.prepend(messageContainer);
        setTimeout(() => messageContainer.remove(), 3000);
    };

    // Sidebar toggle
    const toggleButton = document.querySelector('.toggle-button');
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    if (toggleButton && sidebar && content) {
        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            toggleButton.classList.toggle('active');
            if (window.innerWidth > 768) {
                sidebar.classList.toggle('collapsed');
                content.classList.toggle('sidebar-collapsed');
            }
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('open');
                toggleButton.classList.remove('active');
                sidebar.classList.remove('collapsed');
                content.classList.remove('sidebar-collapsed');
            }
        });
    }
});