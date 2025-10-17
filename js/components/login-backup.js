import sessionManager from './SessionManager.js';

document.addEventListener('DOMContentLoaded', function () {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const form = document.getElementById('loginForm');
    const msg = document.getElementById('loginMessage');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        msg.textContent = '';
        const submit = form.querySelector('button[type=submit]');
        submit.disabled = true;

        // Send JSON payload with email field mapped to username
        const payload = {
            username: form.email.value,  // Map email field to username for backend
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
                msg.textContent = json.message;
                // Force session check to update UI
                await sessionManager.refreshSessionState();
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
});
