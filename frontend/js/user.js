/**
 * User Dashboard Logic
 */

let allComplaints = [];
let currentFilter = 'ALL';

// Auth guard
(function checkAuth() {
    if (!api.isAuthenticated()) {
        window.location.href = '/';
        return;
    }
    const user = api.getUser();
    if (user.role !== 'USER') {
        window.location.href = '/support.html';
        return;
    }

    document.getElementById('nav-username').textContent = user.username;
    document.getElementById('greeting-name').textContent = user.username;
})();

function handleLogout() {
    api.clearAuth();
    window.location.href = '/';
}

// Toggle complaint form
function toggleForm() {
    const card = document.getElementById('complaint-form-card');
    card.classList.toggle('visible');
    if (card.classList.contains('visible')) {
        document.getElementById('complaint-title').focus();
    }
}

// Load complaints
async function loadComplaints() {
    try {
        const data = await api.getComplaints();
        allComplaints = data.complaints;
        updateStats();
        renderComplaints();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function updateStats() {
    const total = allComplaints.length;
    const open = allComplaints.filter(c => c.status === 'OPEN').length;
    const progress = allComplaints.filter(c => c.status === 'IN_PROGRESS').length;
    const closed = allComplaints.filter(c => c.status === 'CLOSED').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-open').textContent = open;
    document.getElementById('stat-progress').textContent = progress;
    document.getElementById('stat-closed').textContent = closed;
}

function filterComplaints(status, btn) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderComplaints();
}

function renderComplaints() {
    const container = document.getElementById('complaints-list');
    let filtered = allComplaints;

    if (currentFilter !== 'ALL') {
        filtered = allComplaints.filter(c => c.status === currentFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>${currentFilter === 'ALL' ? 'No complaints yet. Click "New Complaint" to get started!' : `No ${currentFilter.replace('_', ' ').toLowerCase()} complaints.`}</p>
      </div>
    `;
        return;
    }

    container.innerHTML = filtered.map(complaint => {
        const statusClass = complaint.status.toLowerCase();
        const hasFeedback = complaint.has_feedback > 0;
        const isClosed = complaint.status === 'CLOSED';

        let feedbackHtml = '';
        if (isClosed && !hasFeedback) {
            feedbackHtml = `
        <button class="btn btn-sm btn-primary" onclick="openFeedbackModal(${complaint.id})">
          ⭐ Give Feedback
        </button>
      `;
        } else if (hasFeedback) {
            feedbackHtml = `<span style="color:var(--success);font-size:var(--font-size-xs);font-weight:600;">✅ Feedback Submitted</span>`;
        }

        return `
      <div class="complaint-card">
        <div class="complaint-header">
          <h4>${escapeHtml(complaint.title)}</h4>
          <span class="complaint-id">#${complaint.id}</span>
        </div>
        <div class="complaint-meta">
          <span class="complaint-category">${escapeHtml(complaint.category)}</span>
          <span class="status-badge ${statusClass}">${getStatusEmoji(complaint.status)} ${complaint.status.replace('_', ' ')}</span>
        </div>
        <p class="complaint-description">${escapeHtml(complaint.description)}</p>
        <div class="complaint-footer">
          <span class="complaint-date">🕐 ${formatDate(complaint.created_at)}</span>
          <div class="complaint-actions">
            ${feedbackHtml}
          </div>
        </div>
      </div>
    `;
    }).join('');
}

// Create complaint
async function handleCreateComplaint(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-complaint-btn');
    const title = document.getElementById('complaint-title').value.trim();
    const description = document.getElementById('complaint-description').value.trim();
    const category = document.getElementById('complaint-category').value;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Submitting...';

    try {
        await api.createComplaint(title, description, category);
        showToast('Complaint submitted successfully!', 'success');
        document.getElementById('complaint-form').reset();
        toggleForm();
        await loadComplaints();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Submit Complaint';
    }
}

// Feedback
function openFeedbackModal(complaintId) {
    document.getElementById('feedback-complaint-id').value = complaintId;
    document.getElementById('feedback-modal').classList.add('active');
    document.getElementById('feedback-form').reset();
    document.getElementById('star3').checked = true;
}

function closeFeedbackModal() {
    document.getElementById('feedback-modal').classList.remove('active');
}

async function handleSubmitFeedback(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-feedback-btn');
    const complaintId = document.getElementById('feedback-complaint-id').value;
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const comment = document.getElementById('feedback-comment').value.trim();

    if (!rating) {
        showToast('Please select a rating', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Submitting...';

    try {
        await api.submitFeedback(complaintId, parseInt(rating), comment);
        showToast('Feedback submitted successfully!', 'success');
        closeFeedbackModal();
        await loadComplaints();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Submit Feedback';
    }
}

// Close modal on overlay click
document.getElementById('feedback-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeFeedbackModal();
});

// Initial load
loadComplaints();
