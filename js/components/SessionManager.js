// JWT-based Session Manager with persistent login
class SessionManager {
    constructor() {
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

        // Always show the icon after first session check
        icon.classList.add('session-checked');

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
            // Always show the panel after first session check
            loginPanel.classList.add('session-checked');
            
            if (this.isLoggedIn) {
                loginPanel.style.display = 'none';
            } else {
                loginPanel.style.display = 'block';
            }
        }

        // Update login container
        const loginContainer = document.getElementById('loginContainer');
        const loginText = document.getElementById('loginText');
        if (loginContainer && loginText) {
            if (this.isLoggedIn) {
                loginContainer.classList.add('logged-in');
                loginText.textContent = 'Dashboard';
            } else {
                loginContainer.classList.remove('logged-in');
                loginText.textContent = 'Log in';
            }
        }

        // Show/hide logout elements
        const headerLogout = document.getElementById('headerLogout');
        
        if (headerLogout) {
            headerLogout.style.display = this.isLoggedIn ? 'inline-block' : 'none';
        }
    }

    setupEventListeners() {
        // Login container click handler
        const loginContainer = document.getElementById('loginContainer');
        if (loginContainer) {
            loginContainer.addEventListener('click', () => {
                if (this.isLoggedIn) {
                    // Redirect to dashboard
                    window.location.href = '/html/contents/Dashboard.html';
                } else {
                    // Redirect to login page (index)
                    window.location.href = '/html/contents/Index.html';
                }
            });
        }

        // Icon hover for dropdown (when logged in)
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

// Immediate session check on script load (before DOM ready)
(async () => {
    try {
        const response = await fetch('/php/Login/check_session.php', {
            credentials: 'same-origin'
        });
        const data = await response.json();
        
        sessionManager.isLoggedIn = data.isLoggedIn;
        sessionManager.user = data.user;
        
        // Update icon immediately if it exists
        const icon = document.querySelector('.icon');
        if (icon) {
            sessionManager.updateIconState();
        }
        
        // Update login panel immediately if it exists
        const loginPanel = document.querySelector('.login-panel');
        if (loginPanel) {
            sessionManager.updateUIVisibility();
        }
    } catch (error) {
        console.error('Early session check failed:', error);
        
        // Fallback: show UI elements even if session check fails
        const icon = document.querySelector('.icon');
        if (icon) {
            icon.classList.add('session-checked');
        }
        
        const loginPanel = document.querySelector('.login-panel');
        if (loginPanel) {
            loginPanel.classList.add('session-checked');
        }
    }
})();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure header is loaded
        setTimeout(() => sessionManager.init(), 50);
    });
} else {
    // DOM already loaded
    setTimeout(() => sessionManager.init(), 50);
}

export default sessionManager;