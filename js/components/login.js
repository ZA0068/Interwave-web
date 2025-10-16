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

        // Send JSON payload instead of FormData
        const payload = {
            username: form.email.value,  // or 'username' if you have that field
            password: form.password.value
        };

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'same-origin' // include cookies for session
            });

            const json = await res.json();

            if (res.ok && json) {
                msg.style.color = 'green';
                msg.textContent = json.message || 'Login successful';
                // Update session state immediately
                await sessionManager.refreshSessionState();
            } else {
                msg.style.color = 'crimson';
                msg.textContent = json.message || 'Invalid credentials';
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
