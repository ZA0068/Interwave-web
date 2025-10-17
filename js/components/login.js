import sessionManager from './SessionManager.js';

export default function initLoginForm() {
    const form = document.getElementById('loginForm');
    const msg = document.getElementById('loginMessage');
        const loginPanel = document.querySelector('.login-panel');

        // Hide login form if already logged in
        fetch('/php/Login/check_session.php', { credentials: 'same-origin' })
            .then(res => res.json())
            .then(data => {
                if (data.isLoggedIn && loginPanel) {
                    loginPanel.style.display = 'none';
                }
            });
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        msg.textContent = '';
        const submit = form.querySelector('button[type=submit]');
        submit.disabled = true;

        const payload = {
            username: form.email.value,
            password: form.password.value
        };

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'same-origin'
            });

            const json = await res.json();

            if (res.ok && json.message) {
                msg.style.color = 'green';
                msg.textContent = json.message || 'Login successful';
                await sessionManager.refreshSessionState();
                    // Hide login panel after successful login
                    if (loginPanel) loginPanel.style.display = 'none';
            } else {
                msg.style.color = 'crimson';
                msg.textContent = json.message || 'Login failed';
            }
        } catch (err) {
            msg.style.color = 'crimson';
            msg.textContent = 'Network error';
            console.error('Login error:', err);
        } finally {
            submit.disabled = false;
        }
    });
}
