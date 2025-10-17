/**
 * IndexAuth.js - Authentication UI Controller for Index page
 * Handles showing/hiding login and register forms with smooth transitions
 */

class IndexAuth {
    constructor() {
        this.authContainer = null;
        this.loginContainer = null;
        this.registerContainer = null;
        this.currentForm = 'login'; // 'login' or 'register'
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    setupElements() {
        // Get DOM elements
        this.authContainer = document.getElementById('authContainer');
        this.loginContainer = document.getElementById('loginContainer');
        this.registerContainer = document.getElementById('registerContainer');

        // Setup event listeners
        this.setupEventListeners();
        
        console.log('IndexAuth initialized');
    }

    setupEventListeners() {
        // Show login form button
        const showLoginBtn = document.getElementById('showLoginBtn');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => this.showLogin());
        }

        // Close auth container
        const closeAuth = document.getElementById('closeAuth');
        if (closeAuth) {
            closeAuth.addEventListener('click', () => this.hideAuth());
        }

        // Switch between forms (keep for potential internal switching)
        const switchToRegister = document.getElementById('switchToRegister');
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                // Redirect to register page instead of showing modal
                window.location.href = '/html/contents/Register.html';
            });
        }

        const switchToLogin = document.getElementById('switchToLogin');
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToLogin();
            });
        }

        // Close on backdrop click
        if (this.authContainer) {
            this.authContainer.addEventListener('click', (e) => {
                if (e.target === this.authContainer) {
                    this.hideAuth();
                }
            });
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.authContainer && this.authContainer.classList.contains('show')) {
                this.hideAuth();
            }
        });
    }

    showLogin() {
        this.currentForm = 'login';
        this.showAuthContainer();
        this.switchToLogin();
    }

    showAuthContainer() {
        if (this.authContainer) {
            this.authContainer.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideAuth() {
        if (this.authContainer) {
            this.authContainer.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    switchToLogin() {
        if (this.loginContainer && this.registerContainer) {
            this.loginContainer.style.display = 'block';
            this.registerContainer.style.display = 'none';
            this.currentForm = 'login';
        }
    }

    showMessage(elementId, message, type) {
        const messageDiv = document.getElementById(elementId);
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `message ${type}`;
        }
    }
}

// Initialize IndexAuth when script loads
const indexAuth = new IndexAuth();

// Export for potential external use
window.IndexAuth = IndexAuth;