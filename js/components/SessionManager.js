// Session status checker and icon manager
class SessionManager {
<<<<<<< HEAD
    constructor() {
        this.iconElement = document.querySelector('.site-header .icon');
    this.checkInterval = 30000; // Check every 30 seconds
=======
    constructor(iconSelector = '.site-header .icon') {
        this.iconElement = document.querySelector(iconSelector);
        this.checkInterval = 30000; // Check every 30 seconds
>>>>>>> parent of 71f2a9b (init)
        this.intervalId = null;
        this.isLoggedIn = false;
        this._boundMouseEnter = null;
        this._boundMouseLeave = null;
        
        // Bind methods
        this.updateIconState = this.updateIconState.bind(this);
        this.checkSession = this.checkSession.bind(this);
        this.handleIconClick = this.handleIconClick.bind(this);
        this.handleLogoutClick = this.handleLogoutClick.bind(this);
        
        // Initialize
        if (this.iconElement) {
            this.initializeSessionChecking();
            this.iconElement.addEventListener('click', this.handleIconClick);
        }
    }

    updateIconState(isLoggedIn) {
        if (!this.iconElement) return;

        const container = this.iconElement.querySelector('#logoutButtonContainer');
        const headerLogoutLink = document.querySelector('.main-nav a.logout-link');
        const logoutToggle = this.iconElement.querySelector('#logoutToggle');
        if (isLoggedIn) {
            this.iconElement.classList.add('active');
            this.isLoggedIn = true;
            // Enable hover handlers to show dropdown
            if (!this._boundMouseEnter) {
                this._boundMouseEnter = () => this.iconElement.classList.add('show-logout');
                this._boundMouseLeave = () => this.iconElement.classList.remove('show-logout');
                this.iconElement.addEventListener('mouseenter', this._boundMouseEnter);
                this.iconElement.addEventListener('mouseleave', this._boundMouseLeave);
            }
            if (headerLogoutLink) {
                headerLogoutLink.style.display = '';
                headerLogoutLink.removeEventListener('click', this.handleHeaderLogoutClick);
                headerLogoutLink.addEventListener('click', this.handleHeaderLogoutClick);
            }
            // Wire up logout click inside dropdown (loaded via HTML)
            const btn = this.iconElement.querySelector('#logoutButton');
            if (btn) {
                btn.removeEventListener('click', this.handleLogoutClick);
                btn.addEventListener('click', this.handleLogoutClick);
            }
        } else {
            this.iconElement.classList.remove('active');
            this.iconElement.classList.remove('show-logout');
            this.isLoggedIn = false;
            if (this._boundMouseEnter) {
                this.iconElement.removeEventListener('mouseenter', this._boundMouseEnter);
                this.iconElement.removeEventListener('mouseleave', this._boundMouseLeave);
                this._boundMouseEnter = null;
                this._boundMouseLeave = null;
            }
            if (logoutToggle) logoutToggle.checked = false;
            if (headerLogoutLink) headerLogoutLink.style.display = 'none';
        }
    }

    async checkSession() {
        try {
            const response = await fetch('/Session', {
                credentials: 'same-origin' // Important for session cookies
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            this.updateIconState(data.isLoggedIn);
            
        } catch (error) {
            console.error('Session check failed:', error);
        }
    }

    initializeSessionChecking() {
        // Check immediately
        this.checkSession();
        
        // Set up periodic checking
        this.intervalId = setInterval(this.checkSession, this.checkInterval);
        
        // Clean up on page unload
        window.addEventListener('unload', () => {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        });
    }

    // Public method to force a session check
    refreshSessionState() {
        return this.checkSession();
    }

    async handleIconClick() {
        if (!this.isLoggedIn) return; // Only handle clicks when logged in
        // Toggle sticky dropdown via checkbox to persist visibility
        const toggle = this.iconElement.querySelector('#logoutToggle');
        if (toggle) toggle.checked = !toggle.checked;
    }

    async handleLogoutClick(ev) {
        ev?.preventDefault?.();
        if (!this.isLoggedIn) return;
        await this.performLogout();
    }

    async performLogout() {
        try {
            const response = await fetch('/php/Login/logout.php', {
                method: 'POST',
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.success) {
                this.updateIconState(false);
                window.location.reload();
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    handleHeaderLogoutClick(ev) {
        ev?.preventDefault?.();
        this.performLogout();
    }
}

// Create and export singleton instance
const sessionManager = new SessionManager();
export default sessionManager;