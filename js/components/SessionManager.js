// JWT-based Session Manager with persistent login
class SessionManager {
    constructor() {
        this.iconElement = document.querySelector('.site-header .icon');
    this.checkInterval = 30000; // Check every 30 seconds
        this.intervalId = null;
        this.isLoggedIn = false;
        this.user = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        await this.refreshSessionState();
        this.setupEventListeners();
        this.initialized = true;
    }

    async refreshSessionState() {
        try {
            const response = await fetch('/php/Login/check_session.php', {
                credentials: 'same-origin'
            });
            const data = await response.json();
            
            this.isLoggedIn = data.isLoggedIn;
            this.user = data.user;
            
            this.updateIconState();
            this.updateUIVisibility();
        } catch (error) {
            console.error('Session check failed:', error);
            this.isLoggedIn = false;
            this.user = null;
            this.updateIconState();
            this.updateUIVisibility();
        }
    }

    updateIconState() {
        const icon = document.querySelector('.icon');
        if (!icon) return;

        if (this.isLoggedIn) {
            icon.classList.add('active');
            icon.classList.remove('inactive');
        } else {
            icon.classList.remove('active');
            icon.classList.add('inactive');
        }
    }

    updateUIVisibility() {
        // Hide/show login panel
        const loginPanel = document.querySelector('.login-panel');
        if (loginPanel) {
            loginPanel.style.display = this.isLoggedIn ? 'none' : 'block';
        }

        // Show/hide logout elements
        const headerLogout = document.getElementById('headerLogout');
        
        if (headerLogout) {
            headerLogout.style.display = this.isLoggedIn ? 'inline-block' : 'none';
        }
    }

    setupEventListeners() {
        // Icon hover for dropdown
        const iconContainer = document.querySelector('.icon-container');
        const logoutDropdown = document.getElementById('logoutDropdown');
        
        if (iconContainer && logoutDropdown) {
            let hoverTimeout;
            
            const showDropdown = () => {
                if (this.isLoggedIn) {
                    clearTimeout(hoverTimeout);
                    logoutDropdown.style.display = 'block';
                    // Force reflow
                    logoutDropdown.offsetHeight;
                    logoutDropdown.classList.add('show');
                }
            };
            
            const hideDropdown = () => {
                hoverTimeout = setTimeout(() => {
                    logoutDropdown.classList.remove('show');
                    setTimeout(() => {
                        if (!logoutDropdown.classList.contains('show')) {
                            logoutDropdown.style.display = 'none';
                        }
                    }, 200);
                }, 300);
            };
            
            iconContainer.addEventListener('mouseenter', showDropdown);
            iconContainer.addEventListener('mouseleave', hideDropdown);
            
            logoutDropdown.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
            });
            
            logoutDropdown.addEventListener('mouseleave', hideDropdown);
        }

        // Header logout button
        const headerLogout = document.getElementById('headerLogout');
        if (headerLogout) {
            headerLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Icon dropdown logout button
        const iconLogout = document.getElementById('iconLogout');
        if (iconLogout) {
            iconLogout.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    async logout() {
        try {
            const response = await fetch('/php/Login/logout.php', {
                method: 'POST',
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                this.isLoggedIn = false;
                this.user = null;
                this.updateIconState();
                this.updateUIVisibility();
                
                // Hide dropdown with animation
                const logoutDropdown = document.getElementById('logoutDropdown');
                if (logoutDropdown) {
                    logoutDropdown.classList.remove('show');
                    setTimeout(() => {
                        logoutDropdown.style.display = 'none';
                    }, 200);
                }
                
                // Optional: reload page to reset state
                window.location.reload();
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure header is loaded
        setTimeout(() => sessionManager.init(), 100);
    });
} else {
    // DOM already loaded
    setTimeout(() => sessionManager.init(), 100);
}

export default sessionManager;