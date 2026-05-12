/**
 * Auth Page Logic
 */

// Redirect if already logged in
(function checkAuth() {
    if (api.isAuthenticated()) {
        const user = api.getUser();
        if (user.role === 'SUPPORT') {
            window.location.href = '/support.html';
        } else {
            window.location.href = '/user.html';
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('token')) {
        setTimeout(() => {
            showResetPassword();
        }, 100);
    }
})();

function switchTab(tab, e = null) {
    if (e) e.preventDefault();
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-form');
    const resetForm = document.getElementById('reset-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const authTabs = document.querySelector('.auth-tabs');
    const alertDiv = document.getElementById('auth-alert');
    alertDiv.innerHTML = '';

    authTabs.style.display = 'flex';
    forgotForm.classList.add('hidden');
    resetForm.classList.add('hidden');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    }
}

function showForgotPassword(e) {
    if (e) e.preventDefault();
    document.querySelector('.auth-tabs').style.display = 'none';
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('reset-form').classList.add('hidden');
    document.getElementById('forgot-form').classList.remove('hidden');
    document.getElementById('auth-alert').innerHTML = '';
}

function showResetPassword() {
    document.querySelector('.auth-tabs').style.display = 'none';
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('forgot-form').classList.add('hidden');
    document.getElementById('reset-form').classList.remove('hidden');
    document.getElementById('auth-alert').innerHTML = '';
    showAuthAlert('Please enter your new password.', 'info');
}

function showAuthAlert(message, type = 'error') {
    const alertDiv = document.getElementById('auth-alert');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
    // Auto dismiss after 5s
    setTimeout(() => { alertDiv.innerHTML = ''; }, 5000);
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const loginId = document.getElementById('login-id').value.trim();
    const password = document.getElementById('login-password').value;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';

    try {
        const data = await api.login(loginId, password);
        api.setAuth(data.token, data.user);
        showToast('Login successful!', 'success');

        setTimeout(() => {
            if (data.user.role === 'SUPPORT') {
                window.location.href = '/support.html';
            } else {
                window.location.href = '/user.html';
            }
        }, 500);
    } catch (err) {
        showAuthAlert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    if (!emailRegex.test(email)) {
        showAuthAlert('Only a valid @gmail.com address is allowed.');
        return;
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passRegex.test(password)) {
        showAuthAlert('Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating account...';

    try {
        const data = await api.register(username, email, password, role);
        api.setAuth(data.token, data.user);
        showToast('Account created successfully!', 'success');

        setTimeout(() => {
            if (data.user.role === 'SUPPORT') {
                window.location.href = '/support.html';
            } else {
                window.location.href = '/user.html';
            }
        }, 500);
    } catch (err) {
        showAuthAlert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const btn = document.getElementById('forgot-btn');
    const email = document.getElementById('forgot-email').value.trim();

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Sending request...';

    try {
        const data = await api.forgotPassword(email);
        showToast('Password reset requested successfully', 'success');
        showAuthAlert(data.message, 'success');
        
        // Local simulation detail for usability
        if (data.link) {
            console.log("\n>>> CLICK THIS LINK TO RESET PASSWORD:\n" + data.link + "\n");
        }
    } catch (err) {
        showAuthAlert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Send Reset Link';
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const btn = document.getElementById('reset-btn');
    const password = document.getElementById('reset-password').value;

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passRegex.test(password)) {
        showAuthAlert('Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showAuthAlert('Missing reset token. Please check your link.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Updating...';

    try {
        const data = await api.resetPassword(token, password);
        showToast('Password updated! You can now sign in.', 'success');
        
        setTimeout(() => {
            window.location.href = '/'; // clear query params and restart
        }, 2000);
    } catch (err) {
        showAuthAlert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Update Password';
    }
}
