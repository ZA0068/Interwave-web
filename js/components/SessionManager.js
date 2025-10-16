// Session status checker and icon manager
class SessionManager {
    constructor(iconSelector = '.site-header .icon') {
        this.iconElement = document.querySelector(iconSelector);
        this.checkInterval = 30000; // Check every 30 seconds
        this.intervalId = null;
        this.isLoggedIn = false;
        
        // Bind methods
        this.updateIconState = this.updateIconState.bind(this);
        this.checkSession = this.checkSession.bind(this);
        this.handleIconClick = this.handleIconClick.bind(this);
        
        // Initialize
        if (this.iconElement) {
            this.initializeSessionChecking();
            this.iconElement.addEventListener('click', this.handleIconClick);
        }
    }

    updateIconState(isLoggedIn) {
        if (!this.iconElement) return;
        
        if (isLoggedIn) {
            this.iconElement.classList.add('active');
            this.isLoggedIn = true;
        } else {
            this.iconElement.classList.remove('active');
            this.isLoggedIn = false;
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
        
        try {
            const response = await fetch('/php/Login/logout.php', {
                method: 'POST',
                credentials: 'same-origin'
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (data.success) {
                // Update icon state immediately
                this.updateIconState(false);
                
                // Optional: Reload page or redirect to home
                window.location.reload();
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
}

// Create and export singleton instance
const sessionManager = new SessionManager();
export default sessionManager;