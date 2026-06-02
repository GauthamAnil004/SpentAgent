const API_BASE = 'https://spentagent-api.onrender.com/api';
let currentTransactionId = null;

// File Upload State
let receiptFile = null;
let policyFile = null;

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop('receipt-upload-area', 'receipt-input', handleReceiptSelect);
    setupDragAndDrop('policy-upload-area', 'policy-input', handlePolicySelect);

    document.getElementById('submit-receipt-btn').addEventListener('click', submitReceipt);
    document.getElementById('submit-policy-btn').addEventListener('click', submitPolicy);
    document.getElementById('view-reasoning-btn').addEventListener('click', () => {
        if (currentTransactionId) loadXAIReasoning(currentTransactionId);
    });

    // Chatbot setup
    const chatToggle = document.getElementById('chat-toggle-btn');
    const chatPanel = document.getElementById('chat-panel');
    const closeChat = document.getElementById('close-chat-btn');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const chatInput = document.getElementById('chat-input');
    
    chatToggle.addEventListener('click', () => {
        chatPanel.classList.toggle('hidden');
    });
    
    closeChat.addEventListener('click', () => {
        chatPanel.classList.add('hidden');
    });
    
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
});

// Navigation
function navigate(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Deactivate nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Activate target
    document.getElementById(`screen-${screenId}`).classList.add('active'); if(screenId==='ledger'){
    var addTab = document.getElementById('ledger-add');
    var viewTab = document.getElementById('ledger-view');
    var allTabBtns = document.querySelectorAll('#screen-ledger .tab-btn');
    allTabBtns.forEach(function(b){b.classList.remove('active');});
    if(addTab){addTab.classList.remove('active');addTab.classList.add('hidden');}
    if(viewTab){viewTab.classList.remove('hidden');viewTab.classList.add('active');}
    loadLedgerRecords();
}
    
    // Update nav (if it's a top level screen)
    const navBtn = document.getElementById(`nav-${screenId}`);
    if (navBtn) navBtn.classList.add('active');
}

// Error Handling
function showError(message) {
    const toast = document.getElementById('error-toast');
    document.getElementById('error-message').textContent = message;
    toast.classList.remove('hidden');
    // Auto-hide after 5 seconds
    setTimeout(hideError, 5000);
}

function hideError() {
    document.getElementById('error-toast').classList.add('hidden');
}

// Drag & Drop Setup
function setupDragAndDrop(areaId, inputId, onFileSelect) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);

    area.addEventListener('click', () => input.click());

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
    });

    area.addEventListener('dragleave', () => {
        area.classList.remove('dragover');
    });

    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    });

    input.addEventListener('change', (e) => {
        if (e.target.files.length) {
            onFileSelect(e.target.files[0]);
        }
    });
}

// Receipt Logic
function handleReceiptSelect(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file for the receipt.');
        return;
    }
    receiptFile = file;
    document.getElementById('receipt-upload-content').classList.add('hidden');
    document.getElementById('receipt-preview-container').classList.remove('hidden');
    document.getElementById('receipt-filename').textContent = file.name;
    document.getElementById('submit-receipt-btn').disabled = false;
    
    // Hide previous result
    document.getElementById('result-card').classList.add('hidden');
}

function removeReceipt(e) {
    e.stopPropagation();
    receiptFile = null;
    document.getElementById('receipt-input').value = '';
    document.getElementById('receipt-upload-content').classList.remove('hidden');
    document.getElementById('receipt-preview-container').classList.add('hidden');
    document.getElementById('submit-receipt-btn').disabled = true;
}

async function submitReceipt() {
    if (!receiptFile) return;

    const btn = document.getElementById('submit-receipt-btn');
    const loading = document.getElementById('scanner-loading');
    const resultCard = document.getElementById('result-card');
    
    btn.disabled = true;
    loading.classList.remove('hidden');
    resultCard.classList.add('hidden');
    hideError();

    const formData = new FormData();
    formData.append('file', receiptFile);

    try {
        const response = await fetch(`${API_BASE}/submit-receipt`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Server Error (${response.status})`);
        }

        const data = await response.json();
        currentTransactionId = data.transaction_id;
        
        // Populate Result
        const status = data.status.toLowerCase();
        const badge = document.getElementById('result-badge');
        badge.textContent = status;
        badge.className = `badge ${status}`;

        if (data.extracted_data) {
            const formatCurrency = (val) => val ? `$${parseFloat(val).toFixed(2)}` : 'N/A';
            document.getElementById('res-merchant').textContent = data.extracted_data.merchant || 'Unknown';
            document.getElementById('res-amount').textContent = formatCurrency(data.extracted_data.amount);
            document.getElementById('res-date').textContent = data.extracted_data.date || 'Unknown';
            document.getElementById('res-desc').textContent = data.extracted_data.description || 'Unknown';
        }

        loading.classList.add('hidden');
        resultCard.classList.remove('hidden');

    } catch (err) {
        showError(`Failed to process receipt: ${err.message}`);
        loading.classList.add('hidden');
        btn.disabled = false;
    }
}

// XAI Reasoning Logic
async function loadXAIReasoning(transactionId) {
    navigate('reasoning');
    
    const loading = document.getElementById('reasoning-loading');
    const content = document.getElementById('reasoning-content');
    
    loading.classList.remove('hidden');
    content.classList.add('hidden');
    hideError();

    try {
        const response = await fetch(`${API_BASE}/get-xai-reasoning/${transactionId}`);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Failed to fetch trace (${response.status})`);
        }

        const data = await response.json();

        // Verdict Badge
        const status = data.status.toLowerCase();
        const badge = document.getElementById('xai-badge');
        badge.textContent = status;
        badge.className = `badge large ${status}`;

        // Confidence Percentage
        const confidencePct = Math.round(data.confidence_score * 100);
        document.getElementById('xai-confidence-val').textContent = `${confidencePct}%`;
        
        // Slight delay for animation effect
        setTimeout(() => {
            document.getElementById('xai-confidence-bar').style.width = `${confidencePct}%`;
        }, 100);

        // Policy
        document.getElementById('xai-policy').textContent = data.policy_citation || 'No specific policy cited.';

        // Steps
        const stepsContainer = document.getElementById('xai-steps-container');
        stepsContainer.innerHTML = '';
        if (data.reasoning_steps && data.reasoning_steps.length > 0) {
            data.reasoning_steps.forEach(step => {
                const card = document.createElement('div');
                card.className = 'step-card';
                card.innerHTML = `
                    <div class="step-header">Step ${step.step_number}</div>
                    <div class="step-obs"><strong>Observation:</strong> ${step.observation}</div>
                    <div class="step-con"><strong>Conclusion:</strong> ${step.conclusion}</div>
                `;
                stepsContainer.appendChild(card);
            });
        } else {
            stepsContainer.innerHTML = '<p class="text-muted">No step-by-step trace available.</p>';
        }

        // Full Text
        document.getElementById('xai-full-text').textContent = data.reasoning || 'No overall explanation provided.';

        loading.classList.add('hidden');
        content.classList.remove('hidden');

    } catch (err) {
        showError(`Could not load reasoning: ${err.message}`);
        loading.classList.add('hidden');
        // Let user go back via the UI back button
    }
}

// Policy Upload Logic
function handlePolicySelect(file) {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        showError('Only PDF files are supported for policies.');
        return;
    }
    policyFile = file;
    document.getElementById('policy-upload-content').classList.add('hidden');
    document.getElementById('policy-preview-container').classList.remove('hidden');
    document.getElementById('policy-filename').textContent = file.name;
    document.getElementById('submit-policy-btn').disabled = false;
    document.getElementById('admin-success').classList.add('hidden');
}

function removePolicy(e) {
    e.stopPropagation();
    policyFile = null;
    document.getElementById('policy-input').value = '';
    document.getElementById('policy-upload-content').classList.remove('hidden');
    document.getElementById('policy-preview-container').classList.add('hidden');
    document.getElementById('submit-policy-btn').disabled = true;
}

async function submitPolicy() {
    if (!policyFile) return;

    const btn = document.getElementById('submit-policy-btn');
    const loading = document.getElementById('admin-loading');
    const successCard = document.getElementById('admin-success');
    
    btn.disabled = true;
    loading.classList.remove('hidden');
    successCard.classList.add('hidden');
    hideError();

    const formData = new FormData();
    formData.append('file', policyFile);

    try {
        const response = await fetch(`${API_BASE}/upload-policy`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Server Error (${response.status})`);
        }

        const data = await response.json();
        
        document.getElementById('admin-success-msg').textContent = data.message || 'Policy uploaded successfully.';
        
        loading.classList.add('hidden');
        successCard.classList.remove('hidden');

        // Reset file selection
        removePolicy({ stopPropagation: () => {} });

    } catch (err) {
        showError(`Failed to upload policy: ${err.message}`);
        loading.classList.add('hidden');
        btn.disabled = false;
    }
}

// Chatbot Logic
async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;
    
    input.value = '';
    appendMessage('user', message);
    
    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    const typingHtml = `
        <div id="${typingId}" class="chat-message assistant">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.insertAdjacentHTML('beforeend', typingHtml);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        document.getElementById(typingId)?.remove();
        
        if (!response.ok) {
            appendMessage('assistant', "I'm sorry, I encountered an error connecting to the server.");
            return;
        }
        
        const data = await response.json();
        appendMessage('assistant', data.response);
        
    } catch (err) {
        document.getElementById(typingId)?.remove();
        appendMessage('assistant', "I'm sorry, an error occurred while processing your request.");
    }
}

function appendMessage(role, text) {
    const messagesContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;
    msgDiv.textContent = text;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ----------------------------------------
// Tracker & Ledger Logic
// ----------------------------------------

function switchTab(tabId, event) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (event) event.currentTarget.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Ensure date inputs default to today
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const expenseDate = document.getElementById('expense-date');
    if (expenseDate) expenseDate.value = today;
    const ledgerDate = document.getElementById('ledger-date');
    if (ledgerDate) ledgerDate.value = today;
});

// Tracker Logic
async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE}/personal/expenses`);
        const data = await response.json();
        const list = document.getElementById('expense-list');
        list.innerHTML = '';
        let total = 0;
        
        data.expenses.forEach(exp => {
            total += exp.amount;
            list.innerHTML += `
                <div class="list-card">
                    <div class="list-card-details">
                        <div class="list-card-title">${exp.category} - $${exp.amount.toFixed(2)}</div>
                        <div class="list-card-subtitle">${exp.date} | ${exp.description || 'No description'}</div>
                    </div>
                    <div class="list-card-actions">
                        <button class="remove-btn" onclick="deleteExpense(${exp.id})">Delete</button>
                    </div>
                </div>
            `;
        });
        document.getElementById('total-spent').textContent = `$${total.toFixed(2)}`;
    } catch (e) {
        showError("Failed to load expenses");
    }
}

async function addExpense() {
    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const desc = document.getElementById('expense-desc').value;
    const date = document.getElementById('expense-date').value;
    
    if (!amount || !date) return showError("Amount and Date are required");
    
    try {
        await fetch(`${API_BASE}/personal/add-expense`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({amount: parseFloat(amount), category, description: desc, date})
        });
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-desc').value = '';
        loadExpenses();
    } catch (e) {
        showError("Failed to add expense");
    }
}

async function deleteExpense(id) {
    try {
        await fetch(`${API_BASE}/personal/expense/${id}`, { method: 'DELETE' });
        loadExpenses();
    } catch (e) {
        showError("Failed to delete expense");
    }
}

async function getAnalysis() {
    const btn = document.getElementById('get-analysis-btn');
    const resultDiv = document.getElementById('analysis-result');
    const textDiv = document.getElementById('analysis-text');
    
    btn.disabled = true;
    btn.textContent = "Analyzing...";
    resultDiv.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_BASE}/personal/analyze`);
        const data = await response.json();
        textDiv.textContent = data.analysis;
        resultDiv.classList.remove('hidden');
    } catch (e) {
        showError("Failed to load analysis");
    } finally {
        btn.disabled = false;
        btn.textContent = "Get AI Analysis";
    }
}

// Ledger Logic
async function loadLedgerRecords() {
    const container = document.getElementById('ledger-list');
    if (!container) return;
    container.innerHTML = '<p style="color:#888;">Loading...</p>';

    try {
        const response = await fetch('https://spentagent-api.onrender.com/api/ledger/records');
        const data = await response.json();
        const records = data.records || [];

        const totalLent = records.filter(r => r.type === 'lent' && r.status === 'pending').reduce((s, r) => s + r.amount, 0);
        const totalBorrowed = records.filter(r => r.type === 'borrowed' && r.status === 'pending').reduce((s, r) => s + r.amount, 0);

        let html = '<div style="display:flex;gap:16px;margin-bottom:16px;">';
        html += '<div style="flex:1;background:#1a2a1a;border-radius:10px;padding:14px;text-align:center;"><div style="color:#43A047;font-size:12px;">Total Owed to You</div><div style="color:#fff;font-size:20px;font-weight:600;">$' + totalLent.toFixed(2) + '</div></div>';
        html += '<div style="flex:1;background:#2a1a1a;border-radius:10px;padding:14px;text-align:center;"><div style="color:#E53935;font-size:12px;">Total You Owe</div><div style="color:#fff;font-size:20px;font-weight:600;">$' + totalBorrowed.toFixed(2) + '</div></div>';
        html += '</div>';

        if (records.length === 0) {
            html += '<p style="color:#888;text-align:center;">No ledger entries yet. Add your first entry above.</p>';
        } else {
            records.forEach(r => {
                const typeBadge = r.type === 'lent'
                    ? '<span style="background:#1b5e20;color:#43A047;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;">LENT</span>'
                    : '<span style="background:#b71c1c;color:#ef9a9a;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;">BORROWED</span>';
                const statusBadge = r.status === 'settled'
                    ? '<span style="background:#1b5e20;color:#43A047;padding:2px 8px;border-radius:20px;font-size:11px;">SETTLED</span>'
                    : '<span style="background:#f57f17;color:#fff;padding:2px 8px;border-radius:20px;font-size:11px;">PENDING</span>';
                html += '<div style="background:#131929;border:1px solid #1e2d45;border-radius:12px;padding:16px;margin-bottom:12px;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
                html += '<span style="font-weight:600;color:#fff;font-size:15px;">' + r.friend_name + '</span>';
                html += '<span style="color:#fff;font-weight:700;font-size:16px;">$' + r.amount.toFixed(2) + '</span></div>';
                html += '<div style="display:flex;gap:8px;margin-bottom:8px;">' + typeBadge + statusBadge + '</div>';
                html += '<div style="color:#aaa;font-size:13px;margin-bottom:4px;">' + (r.description || 'No description') + '</div>';
                html += '<div style="color:#aaa;font-size:12px;">' + r.date + ' ? Expected: ' + (r.expected_return_date || 'N/A') + '</div>';
                html += '<div style="display:flex;gap:8px;margin-top:12px;">';
                if (r.status === 'pending') {
                    html += '<button onclick="settleLedger(' + r.id + ')" style="flex:1;padding:8px;background:#1b5e20;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;">Mark Settled</button>';
                }
                html += '<button onclick="deleteLedger(' + r.id + ')" style="flex:1;padding:8px;background:#b71c1c;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;">Delete</button>';
                html += '</div></div>';
            });
        }
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<p style="color:#E53935;">Failed to load records: ' + err.message + '</p>';
    }
}

async function settleLedger(id) {
    await fetch('https://spentagent-api.onrender.com/api/ledger/settle/' + id, { method: 'PATCH' });
    loadLedgerRecords();
}

async function deleteLedger(id) {
    await fetch('https://spentagent-api.onrender.com/api/ledger/delete/' + id, { method: 'DELETE' });
    loadLedgerRecords();
}

// Fix: alias for ledger container id mismatch
const _origLoadLedger = loadLedgerRecords;

async function addLedgerEntry() {
    const name = document.getElementById('ledger-name').value.trim();
    const amount = parseFloat(document.getElementById('ledger-amount').value);
    const type = document.getElementById('ledger-type').value;
    const desc = document.getElementById('ledger-desc').value.trim();
    const date = document.getElementById('ledger-date').value;
    const returnDate = document.getElementById('ledger-return-date').value;

    if (!name || !amount || !date) {
        showError('Please fill in Friend Name, Amount and Date.');
        return;
    }

    try {
        const response = await fetch('https://spentagent-api.onrender.com/api/ledger/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                friend_name: name,
                amount: amount,
                type: type,
                description: desc,
                date: date,
                expected_return_date: returnDate
            })
        });
        const data = await response.json();
        if (response.ok) {
            document.getElementById('ledger-name').value = ''; document.getElementById('ledger-amount').value = ''; document.getElementById('ledger-desc').value = ''; document.getElementById('ledger-view').classList.remove('hidden'); document.getElementById('ledger-view').classList.add('active'); document.getElementById('ledger-add').classList.remove('active'); loadLedgerRecords();
            document.getElementById('ledger-amount').value = '';
            document.getElementById('ledger-desc').value = '';

            loadLedgerRecords();
        } else {
            showError(data.detail || 'Failed to add entry.');
        }
    } catch (err) {
        showError('Failed to add entry: ' + err.message);
    }
}


function showLedgerRecords() {
    var addTab = document.getElementById('ledger-add');
    var viewTab = document.getElementById('ledger-view');
    var btns = document.querySelectorAll('#screen-ledger .tab-btn');
    btns.forEach(function(b){ b.classList.remove('active'); });
    var viewBtn = document.querySelector('#screen-ledger .tab-btn:last-child');
    if(viewBtn) viewBtn.classList.add('active');
    if(addTab){ addTab.classList.add('hidden'); addTab.classList.remove('active'); }
    if(viewTab){ viewTab.classList.remove('hidden'); viewTab.classList.add('active'); }
    loadLedgerRecords();
}
