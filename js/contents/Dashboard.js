import sessionManager from '/js/components/SessionManager.js';

// Dashboard functionality
class Dashboard {
    constructor() {
        this.init();
    }

    async init() {
        // Check if user is logged in
        await sessionManager.refreshSessionState();
        
        if (!sessionManager.isLoggedIn) {
            // Redirect to home if not logged in
            window.location.href = '/html/contents/Index.html';
            return;
        }

        this.loadUserProfile();
        this.updateLastLogin();
    }

    async loadUserProfile() {
        try {
            // Get user info from session
            const response = await fetch('/Session', {
                credentials: 'same-origin'
            });
            const data = await response.json();
            
            if (data.isLoggedIn && data.user) {
                // Update profile fields
                document.getElementById('profileUsername').textContent = data.user || 'Unknown';
                document.getElementById('profileName').textContent = this.capitalizeWords(data.user) || 'Unknown User';
                document.getElementById('profileEmail').textContent = data.user + '@interwave.com' || 'No email';
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    updateLastLogin() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('lastLogin').textContent = `Today at ${timeString}`;
    }

    capitalizeWords(str) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Global functions for button actions
window.editProfile = function() {
    alert('Edit Profile functionality coming soon!');
};

window.updatePassword = function() {
    alert('Change Password functionality coming soon!');
};

window.viewServices = function() {
    window.location.href = '/html/contents/Services.html';
};

window.contactSupport = function() {
    alert('Contact Support: support@interwave.com');
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});