/**
 * Support Dashboard Logic
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
    if (user.role !== 'SUPPORT') {
        window.location.href = '/user.html';
        return;
    }

    document.getElementById('nav-username').textContent = user.username;
})();

function handleLogout() {
    api.clearAuth();
    window.location.href = '/';
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
        <p>${currentFilter === 'ALL' ? 'No complaints in the system yet.' : `No ${currentFilter.replace('_', ' ').toLowerCase()} complaints.`}</p>
      </div>
    `;
        return;
    }

    container.innerHTML = filtered.map(complaint => {
        const statusClass = complaint.status.toLowerCase();
        const hasFeedback = complaint.has_feedback > 0;

        return `
      <div class="complaint-card">
        <div class="complaint-header">
          <h4>${escapeHtml(complaint.title)}</h4>
          <span class="complaint-id">#${complaint.id}</span>
        </div>
        <div class="complaint-meta">
          <span class="complaint-category">${escapeHtml(complaint.category)}</span>
          <span class="status-badge ${statusClass}">${getStatusEmoji(complaint.status)} ${complaint.status.replace('_', ' ')}</span>
          <span class="complaint-user">👤 ${escapeHtml(complaint.username)} (${escapeHtml(complaint.user_email)})</span>
          ${hasFeedback ? '<span style="font-size:var(--font-size-xs);color:var(--success);">⭐ Has Feedback</span>' : ''}
        </div>
        <p class="complaint-description">${escapeHtml(complaint.description)}</p>
        <div class="complaint-footer">
          <span class="complaint-date">🕐 ${formatDate(complaint.created_at)}</span>
          <div class="complaint-actions">
            <button class="btn btn-sm btn-secondary" onclick="viewDetail(${complaint.id})">👁️ View</button>
            <select class="status-select" id="status-select-${complaint.id}" onchange="handleStatusChange(${complaint.id}, this.value)">
              <option value="" disabled selected>Update Status</option>
              <option value="OPEN" ${complaint.status === 'OPEN' ? 'disabled' : ''}>🔴 Open</option>
              <option value="IN_PROGRESS" ${complaint.status === 'IN_PROGRESS' ? 'disabled' : ''}>🟡 In Progress</option>
              <option value="CLOSED" ${complaint.status === 'CLOSED' ? 'disabled' : ''}>🟢 Closed</option>
            </select>
          </div>
        </div>
      </div>
    `;
    }).join('');
}

// Update status
async function handleStatusChange(complaintId, newStatus) {
    if (!newStatus) return;

    try {
        await api.updateComplaintStatus(complaintId, newStatus);
        showToast(`Complaint #${complaintId} status updated to ${newStatus}`, 'success');
        await loadComplaints();
    } catch (err) {
        showToast(err.message, 'error');
        // Reset select
        const select = document.getElementById(`status-select-${complaintId}`);
        if (select) select.value = '';
    }
}

// View detail
async function viewDetail(complaintId) {
    try {
        const data = await api.getComplaint(complaintId);
        const { complaint, feedback } = data;
        const statusClass = complaint.status.toLowerCase();

        let feedbackHtml = '';
        if (feedback) {
            const stars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
            feedbackHtml = `
        <div class="feedback-section">
          <h4 style="font-size:var(--font-size-base);margin-bottom:var(--space-sm);">⭐ User Feedback</h4>
          <div class="feedback-display">
            <div class="stars">${stars}</div>
            <p class="comment">${feedback.comment ? '"' + escapeHtml(feedback.comment) + '"' : 'No comment provided.'}</p>
            <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:var(--space-xs);">Submitted on ${formatDate(feedback.created_at)}</p>
          </div>
        </div>
      `;
        }

        document.getElementById('detail-content').innerHTML = `
      <div class="complaint-header" style="margin-bottom:var(--space-md);">
        <h3>${escapeHtml(complaint.title)}</h3>
        <span class="complaint-id">#${complaint.id}</span>
      </div>
      <div class="complaint-meta" style="margin-bottom:var(--space-md);">
        <span class="complaint-category">${escapeHtml(complaint.category || 'General')}</span>
        <span class="status-badge ${statusClass}">${getStatusEmoji(complaint.status)} ${complaint.status.replace('_', ' ')}</span>
      </div>
      <div style="margin-bottom:var(--space-md);">
        <p style="font-size:var(--font-size-sm);color:var(--text-muted);margin-bottom:var(--space-xs);">👤 Submitted by: <strong style="color:var(--text-primary);">${escapeHtml(complaint.username)}</strong> (${escapeHtml(complaint.user_email)})</p>
        <p style="font-size:var(--font-size-sm);color:var(--text-muted);">🕐 Created: ${formatDate(complaint.created_at)}</p>
        <p style="font-size:var(--font-size-sm);color:var(--text-muted);">🔄 Updated: ${formatDate(complaint.updated_at)}</p>
      </div>
      <div style="background:var(--bg-input);padding:var(--space-md);border-radius:var(--radius-md);border:1px solid var(--border-color);">
        <p style="color:var(--text-secondary);line-height:1.6;">${escapeHtml(complaint.description)}</p>
      </div>
      ${feedbackHtml}
    `;

        document.getElementById('detail-modal').classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.remove('active');
}

// Close modal on overlay click
document.getElementById('detail-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetailModal();
});

// Initial load
loadComplaints();
