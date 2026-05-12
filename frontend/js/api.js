/**
 * API Helper Module
 * Centralized API calls with JWT authentication
 */
// AUTOMATICALLY DETECT ENVIRONMENT
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// IMPORTANT: Replace this string with your actual Vercel Backend URL after you deploy it!
// Example: 'https://complaint-system-backend.vercel.app'
const PRODUCTION_BACKEND_URL = 'https://complaint-management-system-j27kqec6s.vercel.app';

const API_BASE = IS_LOCAL ? 'http://localhost:5050/api' : `${PRODUCTION_BACKEND_URL}/api`;

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('cms_token');
        this.user = JSON.parse(localStorage.getItem('cms_user') || 'null');
    }

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('cms_token', token);
        localStorage.setItem('cms_user', JSON.stringify(user));
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Token expired or invalid
                if (response.status === 401) {
                    this.clearAuth();
                    window.location.href = '/';
                }
                throw new Error(data.error || 'Something went wrong');
            }

            return data;
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                throw new Error('Unable to connect to server. Please try again.');
            }
            throw err;
        }
    }

    // Auth endpoints
    async register(username, email, password, role) {
        return this.request('/auth/register', {
            method: 'POST',
            body: { username, email, password, role },
        });
    }

    async login(loginId, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: { loginId, password },
        });
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: { email },
        });
    }

    async resetPassword(token, password) {
        return this.request(`/auth/reset-password/${token}`, {
            method: 'POST',
            body: { password },
        });
    }

    // Complaint endpoints
    async getComplaints() {
        return this.request('/complaints');
    }

    async getComplaint(id) {
        return this.request(`/complaints/${id}`);
    }

    async createComplaint(title, description, category) {
        return this.request('/complaints', {
            method: 'POST',
            body: { title, description, category },
        });
    }

    async updateComplaintStatus(id, status) {
        return this.request(`/complaints/${id}/status`, {
            method: 'PUT',
            body: { status },
        });
    }

    // Feedback endpoints
    async submitFeedback(complaintId, rating, comment) {
        return this.request(`/complaints/${complaintId}/feedback`, {
            method: 'POST',
            body: { rating, comment },
        });
    }
}

// Singleton
const api = new ApiClient();

// Utility functions
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'Z'); // SQLite returns UTC without Z
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getStatusEmoji(status) {
    switch (status) {
        case 'OPEN': return '🔴';
        case 'IN_PROGRESS': return '🟡';
        case 'CLOSED': return '🟢';
        default: return '⚪';
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
