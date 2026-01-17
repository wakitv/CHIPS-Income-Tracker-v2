// ===================================
// CHIPS Income Tracker v2 - Main App
// ===================================

// ===== HELPER FUNCTIONS =====

// Format number with commas (e.g., 10000 -> "10,000")
function formatWithCommas(num) {
    if (num === null || num === undefined || num === '') return '0';
    const n = parseFloat(String(num).replace(/,/g, '')) || 0;
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Parse formatted number (e.g., "10,000" -> 10000)
function parseFormattedNumber(str) {
    if (!str) return 0;
    return parseFloat(String(str).replace(/,/g, '')) || 0;
}

// Format date long (e.g., "January 17, 2026")
function formatDateLong(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Get shift label (short version)
function getShiftLabel(shift) {
    const labels = {
        '12:00PM to 8:00PM': '12PM - 8PM',
        '8:00PM to 4:00AM': '8PM - 4AM',
        '4:00AM to 12:00PM': '4AM - 12PM'
    };
    return labels[shift] || shift;
}

// Setup comma formatting on input
function setupCommaInput(input) {
    if (!input) return;
    
    input.addEventListener('input', function(e) {
        let value = this.value.replace(/[^0-9.]/g, '');
        if (value) {
            const parts = value.split('.');
            parts[0] = parseInt(parts[0] || 0).toLocaleString('en-US');
            this.value = parts.length > 1 ? parts[0] + '.' + parts[1].slice(0, 2) : parts[0];
        }
    });
    
    input.addEventListener('blur', function() {
        if (this.value) {
            this.value = formatWithCommas(this.value);
        }
    });
}

class ChipsApp {
    constructor() {
        // Data stores
        this.data = {
            cfr: [],
            expenses: [],
            weekly: [],
            team: [],
            siteFund: [],
            retained: [],
            savings: [],
            lastNetChips: 0
        };
        
        // Temporary data for forms
        this.tempChipsIn = [];
        this.tempOtherExpenses = [];
        
        // Chart instance
        this.chart = null;
        
        // Auto-sync interval
        this.syncInterval = null;
        
        // Initialize app
        this.init();
    }
    
    async init() {
        await this.showSplash();
        this.setupEventListeners();
        this.setupAmountInputs();
        this.loadFromCache();
        await this.syncData();
        this.setupAutoSync();
        this.renderDashboard();
    }
    
    async showSplash() {
        return new Promise(resolve => {
            setTimeout(() => {
                document.getElementById('splash').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                resolve();
            }, 2500);
        });
    }
    
    setupAmountInputs() {
        // Setup comma formatting on all amount inputs
        document.querySelectorAll('.amount-input').forEach(input => {
            setupCommaInput(input);
        });
    }
    
    setupDatePickers() {
        // Setup Flatpickr on all date inputs
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            // Destroy existing instance if any
            if (input._flatpickr) {
                input._flatpickr.destroy();
            }
            
            flatpickr(input, {
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "M d, Y",
                theme: "dark",
                disableMobile: false,
                animate: true,
                position: "auto center",
                monthSelectorType: "static",
                prevArrow: "◀",
                nextArrow: "▶",
                onReady: function(selectedDates, dateStr, instance) {
                    // Add custom class for styling
                    instance.calendarContainer.classList.add('chips-calendar');
                }
            });
        });
    }
    
    setupEventListeners() {
        // Menu button (mobile)
        document.getElementById('menuBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('sidebarOverlay').classList.toggle('active');
        });
        
        document.getElementById('sidebarOverlay').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('active');
            document.getElementById('sidebarOverlay').classList.remove('active');
        });
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.handleNavigation(item));
        });
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => this.handleNavigation(item));
        });
        
        // Sub-tabs
        document.querySelectorAll('.sub-tab').forEach(tab => {
            tab.addEventListener('click', () => this.handleSubTab(tab));
        });
        
        // Refresh
        document.getElementById('refreshBtn').addEventListener('click', () => this.handleRefresh());
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('settingsClose').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsCancel').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsSave').addEventListener('click', () => this.handleSaveSettings());
        document.getElementById('testConnection').addEventListener('click', () => this.handleTestConnection());
        
        // Add buttons
        document.getElementById('addCFRBtn')?.addEventListener('click', () => this.openCFRModal());
        document.getElementById('addExpenseBtn')?.addEventListener('click', () => this.openOtherExpensesModal());
        document.getElementById('addWeeklyBtn')?.addEventListener('click', () => this.openWeeklyModal());
        
        // Weekly GGR listener
        document.getElementById('weeklyGGR')?.addEventListener('input', () => this.calculateWeeklyFields());
        
        // Ending Chips listener for NET CHIPS calculation
        document.getElementById('endingChips')?.addEventListener('input', () => this.calculateCFRFields());
    }
    
    handleNavigation(item) {
        const tab = item.dataset.tab;
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll(`.nav-item[data-tab="${tab}"]`).forEach(i => i.classList.add('active'));
        document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll(`.bottom-nav-item[data-tab="${tab}"]`).forEach(i => i.classList.add('active'));
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebarOverlay').classList.remove('active');
        
        this.renderTab(tab);
    }
    
    handleSubTab(tab) {
        const subtab = tab.dataset.subtab;
        document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`subtab-${subtab}`).classList.add('active');
    }
    
    renderTab(tab) {
        switch (tab) {
            case 'dashboard': this.renderDashboard(); break;
            case 'income': this.renderIncomeTracker(); break;
            case 'weekly': this.renderWeeklyTable(); break;
            case 'team': this.renderFundTable('team'); break;
            case 'sitefund': this.renderFundTable('siteFund'); break;
            case 'retained': this.renderFundTable('retained'); break;
            case 'savings': this.renderFundTable('savings'); break;
        }
    }
    
    async handleRefresh() {
        const btn = document.getElementById('refreshBtn');
        if (btn) btn.classList.add('spinning');
        await this.syncData();
        setTimeout(() => { if (btn) btn.classList.remove('spinning'); }, 1000);
    }
    
    async syncData() {
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) {
            syncStatus.classList.add('syncing');
            const syncText = syncStatus.querySelector('.sync-text');
            if (syncText) syncText.textContent = 'Syncing...';
        }
        
        try {
            if (!chipsAPI.isConfigured()) {
                this.loadDemoData();
                if (syncStatus) {
                    syncStatus.classList.remove('syncing');
                    const syncText = syncStatus.querySelector('.sync-text');
                    if (syncText) syncText.textContent = 'Demo Mode';
                }
                this.showToast('Running in Demo Mode', 'warning');
                return;
            }
            
            const result = await chipsAPI.getAllData();
            
            this.data = {
                cfr: result.data.cfr || [],
                expenses: result.data.expenses || [],
                weekly: result.data.weekly || [],
                team: result.data.team || [],
                siteFund: result.data.siteFund || [],
                retained: result.data.retained || [],
                savings: result.data.savings || [],
                lastNetChips: result.data.lastNetChips || 0
            };
            
            cacheManager.save(this.data);
            
            if (syncStatus) {
                syncStatus.classList.remove('syncing', 'error');
                const syncText = syncStatus.querySelector('.sync-text');
                if (syncText) syncText.textContent = 'Synced';
            }
            
            const activeTab = document.querySelector('.nav-item.active')?.dataset.tab || 'dashboard';
            this.renderTab(activeTab);
            
            this.showToast('Data synced!', 'success');
            
        } catch (error) {
            console.error('Sync error:', error);
            if (syncStatus) {
                syncStatus.classList.remove('syncing');
                syncStatus.classList.add('error');
                const syncText = syncStatus.querySelector('.sync-text');
                if (syncText) syncText.textContent = 'Error';
            }
            this.showToast(error.message, 'error');
        }
    }
    
    loadDemoData() {
        this.data = {
            cfr: [
                { rowIndex: 2, date: '2025-01-01', shiftTime: '12:00PM to 8:00PM', cfr: 25000, loaderSalary: 0, chipsIn: 100000, chipsInList: '[{"amount":100000,"remarks":"Starting Chips"}]', endingChips: 75000, netChips: 75000 },
                { rowIndex: 3, date: '2025-01-02', shiftTime: '8:00PM to 4:00AM', cfr: 30000, loaderSalary: 0, chipsIn: 75000, chipsInList: '[{"amount":75000,"remarks":"Starting Chips"}]', endingChips: 45000, netChips: 45000 }
            ],
            expenses: [
                { rowIndex: 2, date: '2025-01-01', total: 5000, expensesList: '[{"amount":3000,"remarks":"Groceries"},{"amount":2000,"remarks":"Gas"}]' },
                { rowIndex: 3, date: '2025-01-02', total: 2500, expensesList: '[{"amount":2500,"remarks":"Load"}]' }
            ],
            weekly: [
                { rowIndex: 2, start: '2025-01-01', end: '2025-01-07', ggr: 500000, loaderSalary: 0, otherExpenses: 7500, netProfit: 492500, roi: 0.985, status: 'Profit', team50: 197000, siteFund35: 137900, retained20: 98500, savings15: 59100 }
            ],
            team: [
                { rowIndex: 2, start: '2025-01-01', end: '2025-01-07', netProfit: 492500, allocated: 197000, spent: 50000, spentList: '[{"amount":50000,"remarks":"Withdrawal"}]', remaining: 147000 }
            ],
            siteFund: [
                { rowIndex: 2, start: '2025-01-01', end: '2025-01-07', netProfit: 492500, allocated: 137900, spent: 10000, spentList: '[{"amount":10000,"remarks":"Office"}]', remaining: 127900 }
            ],
            retained: [
                { rowIndex: 2, start: '2025-01-01', end: '2025-01-07', netProfit: 492500, allocated: 98500, spent: 15000, spentList: '[{"amount":15000,"remarks":"Bills"}]', remaining: 83500 }
            ],
            savings: [
                { rowIndex: 2, start: '2025-01-01', end: '2025-01-07', netProfit: 492500, allocated: 59100, spent: 0, spentList: '[]', remaining: 59100 }
            ],
            lastNetChips: 45000
        };
    }
    
    loadFromCache() {
        const cached = cacheManager.load();
        if (cached && cached.data) {
            this.data = cached.data;
        }
    }
    
    setupAutoSync() {
        const settings = getSettings();
        if (this.syncInterval) clearInterval(this.syncInterval);
        if (settings.autoSync && chipsAPI.isConfigured()) {
            this.syncInterval = setInterval(() => this.syncData(), CONFIG.APP.AUTO_SYNC_INTERVAL);
        }
    }
    
    // ===== DASHBOARD =====
    
    renderDashboard() {
        const weekly = this.data.weekly || [];
        
        const totalProfit = weekly.reduce((sum, w) => sum + (w.netProfit || 0), 0);
        const totalGGR = weekly.reduce((sum, w) => sum + (w.ggr || 0), 0);
        const totalChips = this.data.lastNetChips || 0;
        const avgROI = weekly.length > 0 ? (weekly.reduce((sum, w) => sum + (w.roi || 0), 0) / weekly.length) * 100 : 0;
        
        const el = (id) => document.getElementById(id);
        
        if (el('totalProfit')) el('totalProfit').textContent = formatCurrency(totalProfit);
        if (el('totalGGR')) el('totalGGR').textContent = formatCurrency(totalGGR);
        if (el('totalChips')) el('totalChips').textContent = formatWithCommas(totalChips);
        if (el('avgROI')) el('avgROI').textContent = avgROI.toFixed(2) + '%';
        
        const teamTotal = this.data.team?.reduce((sum, f) => sum + (f.remaining || 0), 0) || 0;
        const siteFundTotal = this.data.siteFund?.reduce((sum, f) => sum + (f.remaining || 0), 0) || 0;
        const retainedTotal = this.data.retained?.reduce((sum, f) => sum + (f.remaining || 0), 0) || 0;
        const savingsTotal = this.data.savings?.reduce((sum, f) => sum + (f.remaining || 0), 0) || 0;
        
        if (el('teamTotal')) el('teamTotal').textContent = formatCurrency(teamTotal);
        if (el('siteFundTotal')) el('siteFundTotal').textContent = formatCurrency(siteFundTotal);
        if (el('retainedTotal')) el('retainedTotal').textContent = formatCurrency(retainedTotal);
        if (el('savingsTotal')) el('savingsTotal').textContent = formatCurrency(savingsTotal);
        
        this.renderWeeklyChart();
        this.renderRecentActivity();
    }
    
    renderWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;
        if (this.chart) this.chart.destroy();
        
        const weekly = this.data.weekly?.slice(-12) || [];
        const labels = weekly.map(w => formatDate(w.start));
        const profits = weekly.map(w => w.netProfit > 0 ? w.netProfit : 0);
        const losses = weekly.map(w => w.netProfit < 0 ? Math.abs(w.netProfit) : 0);
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Profit', data: profits, backgroundColor: 'rgba(0, 255, 136, 0.7)', borderRadius: 4 },
                    { label: 'Loss', data: losses, backgroundColor: 'rgba(255, 71, 87, 0.7)', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606070' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606070', callback: v => '₱' + (v/1000) + 'K' } }
                }
            }
        });
    }
    
    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        const cfr = this.data.cfr || [];
        
        if (cfr.length === 0) {
            container.innerHTML = '<div class="recent-item"><p style="color: var(--text-muted); text-align: center; width: 100%;">No recent activity</p></div>';
            return;
        }
        
        const recent = [...cfr].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        
        container.innerHTML = recent.map(item => `
            <div class="recent-item">
                <div class="recent-icon">💰</div>
                <div class="recent-info">
                    <div class="recent-title">${item.shiftTime}</div>
                    <div class="recent-date">${formatDate(item.date)}</div>
                </div>
                <div class="recent-amount positive">${formatCurrency(item.cfr)}</div>
            </div>
        `).join('');
    }
    
    // ===== INCOME TRACKER =====
    
    renderIncomeTracker() {
        this.renderCFRTable();
        this.renderExpensesTable();
        
        const lastNetChipsEl = document.getElementById('lastNetChips');
        const todayCFREl = document.getElementById('todayCFR');
        const todayExpensesEl = document.getElementById('todayExpenses');
        
        if (lastNetChipsEl) {
            lastNetChipsEl.textContent = formatWithCommas(this.data.lastNetChips);
        }
        
        // Get today's date - use local date format
        const now = new Date();
        const todayStr = now.getFullYear() + '-' + 
                        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(now.getDate()).padStart(2, '0');
        
        // Calculate Today's CFR and Expenses
        let todayCFR = 0;
        let todayLoaderSalary = 0;
        
        if (this.data.cfr && this.data.cfr.length > 0) {
            this.data.cfr.forEach(c => {
                // Normalize the date for comparison
                const entryDate = c.date ? c.date.split('T')[0] : '';
                if (entryDate === todayStr) {
                    todayCFR += parseFloat(c.cfr) || 0;
                    todayLoaderSalary += parseFloat(c.loaderSalary) || 0;
                }
            });
        }
        
        // Calculate Today's Other Expenses
        let todayOtherExp = 0;
        if (this.data.expenses && this.data.expenses.length > 0) {
            this.data.expenses.forEach(e => {
                const entryDate = e.date ? e.date.split('T')[0] : '';
                if (entryDate === todayStr) {
                    todayOtherExp += parseFloat(e.total) || 0;
                }
            });
        }
        
        // Today's Expenses = Loader Salary + Other Expenses
        const todayExp = todayLoaderSalary + todayOtherExp;
        
        if (todayCFREl) {
            todayCFREl.textContent = formatCurrency(todayCFR);
        }
        if (todayExpensesEl) {
            todayExpensesEl.textContent = formatCurrency(todayExp);
        }
        
        console.log('Today:', todayStr, '| CFR:', todayCFR, '| Loader:', todayLoaderSalary, '| OtherExp:', todayOtherExp, '| TotalExp:', todayExp);
    }
    
    renderCFRTable() {
        const container = document.getElementById('cfrGroupedContainer');
        if (!container) {
            console.log('cfrGroupedContainer not found');
            return;
        }
        
        const cfr = this.data.cfr || [];
        
        if (cfr.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No CFR entries. Click "+ CFR Entry" to add.</p>
                </div>
            `;
            return;
        }
        
        // Group entries by date
        const grouped = {};
        cfr.forEach(item => {
            const dateKey = item.date ? item.date.split('T')[0] : 'Unknown';
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(item);
        });
        
        // Sort dates descending (newest first)
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
        
        // Define shift order
        const shiftOrder = ['12:00PM to 8:00PM', '8:00PM to 4:00AM', '4:00AM to 12:00PM'];
        
        // Build HTML
        let html = '';
        
        sortedDates.forEach(dateKey => {
            const entries = grouped[dateKey];
            
            // Sort entries by shift order
            entries.sort((a, b) => {
                return shiftOrder.indexOf(a.shiftTime) - shiftOrder.indexOf(b.shiftTime);
            });
            
            // Calculate daily totals
            const dailyCFR = entries.reduce((sum, e) => sum + (parseFloat(e.cfr) || 0), 0);
            const dailyLoader = entries.reduce((sum, e) => sum + (parseFloat(e.loaderSalary) || 0), 0);
            
            html += `
                <div class="date-group">
                    <div class="date-group-header">
                        <div class="date-group-title">
                            <span class="date-icon">📅</span>
                            <span class="date-text">${formatDateLong(dateKey)}</span>
                        </div>
                        <div class="date-group-summary">
                            <span class="summary-item">CFR: <strong class="positive">${formatCurrency(dailyCFR)}</strong></span>
                            <span class="summary-item">Loader: <strong>${formatCurrency(dailyLoader)}</strong></span>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table shift-table">
                            <thead>
                                <tr>
                                    <th>Shift</th>
                                    <th>CFR/Chips Out</th>
                                    <th>Loader</th>
                                    <th>Chips In</th>
                                    <th>Ending</th>
                                    <th>Net Chips</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            // Add each shift (show all 3 shifts, even if empty)
            shiftOrder.forEach(shift => {
                const entry = entries.find(e => e.shiftTime === shift);
                
                if (entry) {
                    html += `
                        <tr>
                            <td><span class="shift-badge">${getShiftLabel(shift)}</span></td>
                            <td class="positive">${formatWithCommas(entry.cfr)}</td>
                            <td>${formatWithCommas(entry.loaderSalary)}</td>
                            <td>${formatWithCommas(entry.chipsIn)}</td>
                            <td>${formatWithCommas(entry.endingChips || 0)}</td>
                            <td class="${getValueClass(entry.netChips)}">${formatWithCommas(entry.netChips)}</td>
                            <td>
                                <button class="action-btn edit" onclick="app.editCFR(${entry.rowIndex})">Edit</button>
                                <button class="action-btn delete" onclick="app.deleteCFR(${entry.rowIndex})">Del</button>
                            </td>
                        </tr>
                    `;
                } else {
                    html += `
                        <tr class="empty-shift">
                            <td><span class="shift-badge empty">${getShiftLabel(shift)}</span></td>
                            <td colspan="6" class="no-entry">
                                <button class="add-shift-btn" onclick="app.openCFRModalWithDate('${dateKey}', '${shift}')">+ Add Entry</button>
                            </td>
                        </tr>
                    `;
                }
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    openCFRModalWithDate(date, shift) {
        this.openCFRModal();
        document.getElementById('cfrDate').value = date;
        document.getElementById('cfrShift').value = shift;
        
        // Re-setup date picker with the value
        setTimeout(() => {
            this.setupDatePickers();
        }, 150);
    }
    
    renderExpensesTable() {
        const tbody = document.getElementById('expensesTableBody');
        if (!tbody) {
            console.log('expensesTableBody not found');
            return;
        }
        
        const expenses = this.data.expenses || [];
        
        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No expenses. Click "+ Other Expenses" to add.</td></tr>';
            return;
        }
        
        const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date) || b.rowIndex - a.rowIndex);
        
        tbody.innerHTML = sorted.map(item => {
            let details = '-';
            try {
                const list = JSON.parse(item.expensesList || '[]');
                details = list.length > 0 ? list.map(e => e.remarks).join(', ') : '-';
            } catch(e) {}
            
            return `
                <tr>
                    <td>${formatDate(item.date)}</td>
                    <td class="negative">${formatCurrency(item.total)}</td>
                    <td>${details.substring(0, 50)}${details.length > 50 ? '...' : ''}</td>
                    <td>
                        <button class="action-btn view" onclick="app.viewDetails('${encodeURIComponent(item.expensesList || '[]')}')">View</button>
                        <button class="action-btn edit" onclick="app.editExpenses(${item.rowIndex})">Edit</button>
                        <button class="action-btn delete" onclick="app.deleteExpenses(${item.rowIndex})">Del</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // ===== CFR MODAL =====
    
    openCFRModal(editData = null) {
        this.tempChipsIn = [];
        
        const form = document.getElementById('cfrForm');
        const rowIndex = document.getElementById('cfrRowIndex');
        const chipsInList = document.getElementById('chipsInList');
        
        if (form) form.reset();
        if (rowIndex) rowIndex.value = '';
        if (chipsInList) chipsInList.innerHTML = '';
        
        // Setup comma formatting
        this.setupAmountInputs();
        
        if (editData) {
            const el = (id) => document.getElementById(id);
            if (el('cfrModalTitle')) el('cfrModalTitle').textContent = 'Edit CFR Entry';
            if (el('cfrRowIndex')) el('cfrRowIndex').value = editData.rowIndex;
            if (el('cfrDate')) el('cfrDate').value = formatDateForInput(editData.date);
            if (el('cfrShift')) el('cfrShift').value = editData.shiftTime;
            if (el('cfrAmount')) el('cfrAmount').value = formatWithCommas(editData.cfr);
            if (el('cfrLoaderSalary')) el('cfrLoaderSalary').value = formatWithCommas(editData.loaderSalary);
            if (el('endingChips')) el('endingChips').value = formatWithCommas(editData.endingChips || editData.netChips || 0);
            
            try {
                this.tempChipsIn = JSON.parse(editData.chipsInList || '[]');
            } catch(e) {}
            
            this.renderChipsInList();
            if (el('autoFillNotice')) el('autoFillNotice').style.display = 'none';
        } else {
            const el = (id) => document.getElementById(id);
            if (el('cfrModalTitle')) el('cfrModalTitle').textContent = 'Add CFR Entry';
            if (el('cfrDate')) el('cfrDate').value = new Date().toISOString().split('T')[0];
            if (el('cfrLoaderSalary')) el('cfrLoaderSalary').value = '0';
            if (el('endingChips')) el('endingChips').value = '';
            
            const lastNetChips = this.data.lastNetChips || 0;
            if (el('autoFillValue')) el('autoFillValue').textContent = formatWithCommas(lastNetChips);
            if (el('autoFillNotice')) el('autoFillNotice').style.display = lastNetChips > 0 ? 'block' : 'none';
            
            if (lastNetChips > 0) {
                this.tempChipsIn = [{ amount: lastNetChips, remarks: 'Starting Chips' }];
                this.renderChipsInList();
            }
        }
        
        this.calculateCFRFields();
        const modal = document.getElementById('cfrModal');
        if (modal) modal.classList.add('active');
        
        // Re-setup inputs after modal is shown
        setTimeout(() => {
            this.setupAmountInputs();
            this.setupDatePickers();
        }, 100);
    }
    
    closeCFRModal() {
        const modal = document.getElementById('cfrModal');
        if (modal) modal.classList.remove('active');
    }
    
    addChipsInItem() {
        const amountEl = document.getElementById('newChipsInAmount');
        const remarksEl = document.getElementById('newChipsInRemarks');
        
        const amount = parseFormattedNumber(amountEl?.value);
        const remarks = remarksEl?.value?.trim() || '';
        
        if (amount <= 0) { this.showToast('Enter valid amount', 'warning'); return; }
        
        this.tempChipsIn.push({ amount, remarks: remarks || 'No remarks' });
        this.renderChipsInList();
        this.calculateCFRFields();
        
        if (amountEl) amountEl.value = '';
        if (remarksEl) remarksEl.value = '';
    }
    
    removeChipsInItem(index) {
        this.tempChipsIn.splice(index, 1);
        this.renderChipsInList();
        this.calculateCFRFields();
    }
    
    renderChipsInList() {
        const list = document.getElementById('chipsInList');
        if (!list) return;
        
        list.innerHTML = this.tempChipsIn.map((item, i) => `
            <div class="multi-input-item">
                <span class="item-amount">${formatWithCommas(item.amount)}</span>
                <span class="item-remarks">${item.remarks}</span>
                <button type="button" class="item-remove" onclick="app.removeChipsInItem(${i})">×</button>
            </div>
        `).join('');
    }
    
    calculateCFRFields() {
        const totalChipsIn = this.tempChipsIn.reduce((sum, item) => sum + item.amount, 0);
        const endingChipsEl = document.getElementById('endingChips');
        const endingChips = parseFormattedNumber(endingChipsEl?.value);
        
        // NET CHIPS = Ending Chips directly
        const netChips = endingChips;
        
        const totalEl = document.getElementById('totalChipsIn');
        const netEl = document.getElementById('calculatedNetChips');
        
        if (totalEl) totalEl.textContent = formatWithCommas(totalChipsIn);
        if (netEl) netEl.textContent = formatWithCommas(netChips);
    }
    
    async saveCFREntry() {
        const rowIndex = document.getElementById('cfrRowIndex').value;
        const date = document.getElementById('cfrDate').value;
        const shiftTime = document.getElementById('cfrShift').value;
        const cfr = parseFormattedNumber(document.getElementById('cfrAmount').value);
        const loaderSalary = parseFormattedNumber(document.getElementById('cfrLoaderSalary').value);
        const endingChips = parseFormattedNumber(document.getElementById('endingChips').value);
        
        if (!date || cfr <= 0) {
            this.showToast('Fill required fields', 'warning');
            return;
        }
        
        const data = {
            date,
            shiftTime,
            cfr,
            loaderSalary,
            chipsInList: this.tempChipsIn,
            endingChips,
            netChips: endingChips // NET CHIPS = Ending Chips
        };
        
        if (rowIndex) data.rowIndex = parseInt(rowIndex);
        
        try {
            this.showToast('Saving...', 'info');
            if (rowIndex) {
                await chipsAPI.updateCFREntry(data);
            } else {
                await chipsAPI.addCFREntry(data);
            }
            this.closeCFRModal();
            await this.syncData();
            this.showToast('CFR entry saved!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    editCFR(rowIndex) {
        const item = this.data.cfr.find(c => c.rowIndex === rowIndex);
        if (item) this.openCFRModal(item);
    }
    
    async deleteCFR(rowIndex) {
        if (!confirm('Delete this CFR entry?')) return;
        try {
            await chipsAPI.deleteCFREntry(rowIndex);
            await this.syncData();
            this.showToast('Deleted!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    // ===== OTHER EXPENSES MODAL =====
    
    openOtherExpensesModal(editData = null) {
        this.tempOtherExpenses = [];
        
        const el = (id) => document.getElementById(id);
        
        if (el('otherExpensesForm')) el('otherExpensesForm').reset();
        if (el('otherExpensesRowIndex')) el('otherExpensesRowIndex').value = '';
        if (el('otherExpensesList')) el('otherExpensesList').innerHTML = '';
        
        if (editData) {
            if (el('otherExpensesModalTitle')) el('otherExpensesModalTitle').textContent = 'Edit Other Expenses';
            if (el('otherExpensesRowIndex')) el('otherExpensesRowIndex').value = editData.rowIndex;
            if (el('otherExpensesDate')) el('otherExpensesDate').value = formatDateForInput(editData.date);
            
            try {
                this.tempOtherExpenses = JSON.parse(editData.expensesList || '[]');
            } catch(e) {}
            
            this.renderOtherExpensesList();
        } else {
            if (el('otherExpensesModalTitle')) el('otherExpensesModalTitle').textContent = 'Add Other Expenses';
            if (el('otherExpensesDate')) el('otherExpensesDate').value = new Date().toISOString().split('T')[0];
        }
        
        this.calculateOtherExpenses();
        if (el('otherExpensesModal')) el('otherExpensesModal').classList.add('active');
        
        // Setup inputs after modal is shown
        setTimeout(() => {
            this.setupAmountInputs();
            this.setupDatePickers();
        }, 100);
    }
    
    closeOtherExpensesModal() {
        const modal = document.getElementById('otherExpensesModal');
        if (modal) modal.classList.remove('active');
    }
    
    addExpenseItem() {
        const amountEl = document.getElementById('newExpenseAmount');
        const remarksEl = document.getElementById('newExpenseRemarks');
        
        const amount = parseFormattedNumber(amountEl?.value);
        const remarks = remarksEl?.value?.trim() || '';
        
        if (amount <= 0) { this.showToast('Enter valid amount', 'warning'); return; }
        
        this.tempOtherExpenses.push({ amount, remarks: remarks || 'No remarks' });
        this.renderOtherExpensesList();
        this.calculateOtherExpenses();
        
        if (amountEl) amountEl.value = '';
        if (remarksEl) remarksEl.value = '';
    }
    
    removeExpenseItem(index) {
        this.tempOtherExpenses.splice(index, 1);
        this.renderOtherExpensesList();
        this.calculateOtherExpenses();
    }
    
    renderOtherExpensesList() {
        const list = document.getElementById('otherExpensesList');
        if (!list) return;
        
        list.innerHTML = this.tempOtherExpenses.map((item, i) => `
            <div class="multi-input-item">
                <span class="item-amount">${formatCurrency(item.amount)}</span>
                <span class="item-remarks">${item.remarks}</span>
                <button type="button" class="item-remove" onclick="app.removeExpenseItem(${i})">×</button>
            </div>
        `).join('');
    }
    
    calculateOtherExpenses() {
        const total = this.tempOtherExpenses.reduce((sum, item) => sum + item.amount, 0);
        const el = document.getElementById('totalOtherExpenses');
        if (el) el.textContent = formatCurrency(total);
    }
    
    async saveOtherExpensesEntry() {
        const rowIndex = document.getElementById('otherExpensesRowIndex').value;
        const date = document.getElementById('otherExpensesDate').value;
        
        if (!date || this.tempOtherExpenses.length === 0) {
            this.showToast('Add at least one expense', 'warning');
            return;
        }
        
        const data = {
            date,
            expensesList: this.tempOtherExpenses
        };
        
        if (rowIndex) data.rowIndex = parseInt(rowIndex);
        
        try {
            this.showToast('Saving...', 'info');
            if (rowIndex) {
                await chipsAPI.updateExpensesEntry(data);
            } else {
                await chipsAPI.addExpensesEntry(data);
            }
            this.closeOtherExpensesModal();
            await this.syncData();
            this.showToast('Expenses saved!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    editExpenses(rowIndex) {
        const item = this.data.expenses.find(e => e.rowIndex === rowIndex);
        if (item) this.openOtherExpensesModal(item);
    }
    
    async deleteExpenses(rowIndex) {
        if (!confirm('Delete this expense entry?')) return;
        try {
            await chipsAPI.deleteExpensesEntry(rowIndex);
            await this.syncData();
            this.showToast('Deleted!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    // ===== WEEKLY SUMMARY =====
    
    renderWeeklyTable() {
        const tbody = document.getElementById('weeklyTableBody');
        if (!tbody) return;
        
        const weekly = this.data.weekly || [];
        
        if (weekly.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align: center; color: var(--text-muted);">No data. Click "New Cutoff" to create.</td></tr>';
            return;
        }
        
        const sorted = [...weekly].sort((a, b) => new Date(b.start) - new Date(a.start));
        
        tbody.innerHTML = sorted.map(item => `
            <tr>
                <td>${formatDate(item.start)}</td>
                <td>${formatDate(item.end)}</td>
                <td class="positive">${formatCurrency(item.ggr)}</td>
                <td>${formatCurrency(item.loaderSalary)}</td>
                <td>${formatCurrency(item.otherExpenses)}</td>
                <td class="${getValueClass(item.netProfit)}">${formatCurrency(item.netProfit)}</td>
                <td>${(item.roi * 100).toFixed(2)}%</td>
                <td><span class="${item.status === 'Profit' ? 'status-profit' : 'status-loss'}">${item.status}</span></td>
                <td>${formatCurrency(item.team50)}</td>
                <td>${formatCurrency(item.siteFund35)}</td>
                <td>${formatCurrency(item.retained20)}</td>
                <td>${formatCurrency(item.savings15)}</td>
                <td>
                    <button class="action-btn edit" onclick="app.editWeekly(${item.rowIndex})">Edit</button>
                    <button class="action-btn delete" onclick="app.deleteWeekly(${item.rowIndex})">Del</button>
                </td>
            </tr>
        `).join('');
    }
    
    openWeeklyModal(editData = null) {
        document.getElementById('weeklyForm').reset();
        document.getElementById('weeklyRowIndex').value = '';
        
        if (editData) {
            document.querySelector('#weeklyModal .modal-title').textContent = 'Edit Weekly Cutoff';
            document.getElementById('weeklyRowIndex').value = editData.rowIndex;
            document.getElementById('weeklyStart').value = formatDateForInput(editData.start);
            document.getElementById('weeklyEnd').value = formatDateForInput(editData.end);
            document.getElementById('weeklyGGR').value = editData.ggr;
            document.getElementById('weeklyLoaderSalary').value = editData.loaderSalary;
            document.getElementById('weeklyOtherExp').value = editData.otherExpenses;
            this.calculateWeeklyFields();
        } else {
            document.querySelector('#weeklyModal .modal-title').textContent = 'New Weekly Cutoff';
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 6);
            document.getElementById('weeklyStart').value = start.toISOString().split('T')[0];
            document.getElementById('weeklyEnd').value = end.toISOString().split('T')[0];
            this.resetWeeklyCalculations();
        }
        
        document.getElementById('weeklyModal').classList.add('active');
        
        // Setup date pickers after modal is shown
        setTimeout(() => {
            this.setupDatePickers();
        }, 100);
    }
    
    closeWeeklyModal() {
        document.getElementById('weeklyModal').classList.remove('active');
    }
    
    async calculateFromDates() {
        const startDate = document.getElementById('weeklyStart').value;
        const endDate = document.getElementById('weeklyEnd').value;
        
        if (!startDate || !endDate) {
            this.showToast('Select dates first', 'warning');
            return;
        }
        
        try {
            if (chipsAPI.isConfigured()) {
                this.showToast('Calculating...', 'info');
                const result = await chipsAPI.calculateWeeklySummary(startDate, endDate);
                document.getElementById('weeklyLoaderSalary').value = result.loaderSalary || 0;
                document.getElementById('weeklyOtherExp').value = result.otherExpenses || 0;
                this.calculateWeeklyFields();
                this.showToast('Calculated!', 'success');
            } else {
                // Demo mode calculation
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59);
                
                let loaderSalary = 0, otherExpenses = 0;
                
                this.data.cfr?.forEach(item => {
                    const d = new Date(item.date);
                    if (d >= start && d <= end) {
                        loaderSalary += item.loaderSalary || 0;
                    }
                });
                
                this.data.expenses?.forEach(item => {
                    const d = new Date(item.date);
                    if (d >= start && d <= end) {
                        otherExpenses += item.total || 0;
                    }
                });
                
                document.getElementById('weeklyLoaderSalary').value = loaderSalary;
                document.getElementById('weeklyOtherExp').value = otherExpenses;
                this.calculateWeeklyFields();
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    calculateWeeklyFields() {
        const ggr = parseFloat(document.getElementById('weeklyGGR').value) || 0;
        const loaderSalary = parseFloat(document.getElementById('weeklyLoaderSalary').value) || 0;
        const otherExp = parseFloat(document.getElementById('weeklyOtherExp').value) || 0;
        
        const netProfit = ggr - loaderSalary - otherExp;
        const roi = ggr > 0 ? (netProfit / ggr) : 0;
        const status = netProfit >= 0 ? 'Profit' : 'Loss';
        
        // Correct Distribution Formula:
        // Retained = Net Profit × 20% (set aside first)
        // Distribution = Net Profit × 80%
        // From Distribution: Team 50%, Site Fund 35%, Savings 15%
        const retained20 = netProfit * 0.20;
        const distribution80 = netProfit * 0.80;
        const team50 = distribution80 * 0.50;
        const site35 = distribution80 * 0.35;
        const savings15 = distribution80 * 0.15;
        
        document.getElementById('calcNetProfit').textContent = formatCurrency(netProfit);
        document.getElementById('calcNetProfit').className = `calc-value ${getValueClass(netProfit)}`;
        document.getElementById('calcROI').textContent = (roi * 100).toFixed(2) + '%';
        document.getElementById('calcStatus').textContent = status;
        document.getElementById('calcStatus').style.color = status === 'Profit' ? 'var(--green)' : 'var(--red)';
        document.getElementById('calcDist80').textContent = formatCurrency(distribution80);
        document.getElementById('calcTeam50').textContent = formatCurrency(team50);
        document.getElementById('calcSite35').textContent = formatCurrency(site35);
        document.getElementById('calcRetained20').textContent = formatCurrency(retained20);
        document.getElementById('calcSavings15').textContent = formatCurrency(savings15);
    }
    
    resetWeeklyCalculations() {
        ['calcNetProfit', 'calcROI', 'calcStatus', 'calcDist80', 'calcTeam50', 'calcSite35', 'calcRetained20', 'calcSavings15'].forEach(id => {
            document.getElementById(id).textContent = id === 'calcROI' ? '0%' : (id === 'calcStatus' ? '-' : '₱0');
        });
    }
    
    async saveWeeklySummary() {
        const rowIndex = document.getElementById('weeklyRowIndex').value;
        const start = document.getElementById('weeklyStart').value;
        const end = document.getElementById('weeklyEnd').value;
        const ggr = parseFloat(document.getElementById('weeklyGGR').value) || 0;
        const loaderSalary = parseFloat(document.getElementById('weeklyLoaderSalary').value) || 0;
        const otherExpenses = parseFloat(document.getElementById('weeklyOtherExp').value) || 0;
        
        if (!start || !end || ggr <= 0) {
            this.showToast('Fill required fields', 'warning');
            return;
        }
        
        const data = { start, end, ggr, loaderSalary, otherExpenses };
        if (rowIndex) data.rowIndex = parseInt(rowIndex);
        
        try {
            this.showToast('Saving...', 'info');
            if (rowIndex) {
                await chipsAPI.updateWeeklySummary(data);
            } else {
                await chipsAPI.addWeeklySummary(data);
            }
            this.closeWeeklyModal();
            await this.syncData();
            this.showToast('Weekly summary saved!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    editWeekly(rowIndex) {
        const item = this.data.weekly.find(w => w.rowIndex === rowIndex);
        if (item) this.openWeeklyModal(item);
    }
    
    async deleteWeekly(rowIndex) {
        if (!confirm('Delete this weekly summary?')) return;
        try {
            await chipsAPI.deleteWeeklySummary(rowIndex);
            await this.syncData();
            this.showToast('Deleted!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    // ===== FUND TABLES =====
    
    renderFundTable(type) {
        const config = {
            team: { tableId: 'teamTable', allocLabel: 'Team 50%', allocId: 'teamAllocated', spentId: 'teamWithdrawn', remainId: 'teamRemaining' },
            siteFund: { tableId: 'siteFundTable', allocLabel: 'Site Fund 35%', allocId: 'siteFundAllocated', spentId: 'siteFundSpent', remainId: 'siteFundRemaining' },
            retained: { tableId: 'retainedTable', allocLabel: 'Retained 20%', allocId: 'retainedAllocated', spentId: 'retainedSpent', remainId: 'retainedRemaining' },
            savings: { tableId: 'savingsTable', allocLabel: 'Savings 15%', allocId: 'savingsAllocated', spentId: 'savingsWithdrawn', remainId: 'savingsBalance' }
        };
        
        const c = config[type];
        const tbody = document.getElementById(c.tableId + 'Body');
        if (!tbody) return;
        
        const data = this.data[type] || [];
        
        const allocated = data.reduce((sum, f) => sum + (f.allocated || 0), 0);
        const spent = data.reduce((sum, f) => sum + (f.spent || 0), 0);
        const remaining = data.reduce((sum, f) => sum + (f.remaining || 0), 0);
        
        const el = (id) => document.getElementById(id);
        if (el(c.allocId)) el(c.allocId).textContent = formatCurrency(allocated);
        if (el(c.spentId)) el(c.spentId).textContent = formatCurrency(spent);
        if (el(c.remainId)) {
            el(c.remainId).textContent = formatCurrency(remaining);
            el(c.remainId).className = `fund-value ${getValueClass(remaining)}`;
        }
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No data available</td></tr>';
            return;
        }
        
        const sorted = [...data].sort((a, b) => new Date(b.start) - new Date(a.start));
        const sheetName = type === 'team' ? 'Team 50%' : (type === 'siteFund' ? 'Site Fund 35%' : (type === 'retained' ? 'Retained 20%' : 'Savings 15%'));
        
        tbody.innerHTML = sorted.map(item => `
            <tr>
                <td>${formatDate(item.start)}</td>
                <td>${formatDate(item.end)}</td>
                <td>${formatCurrency(item.netProfit)}</td>
                <td class="positive">${formatCurrency(item.allocated)}</td>
                <td class="negative">${formatCurrency(item.spent)}</td>
                <td class="${getValueClass(item.remaining)}">${formatCurrency(item.remaining)}</td>
                <td>
                    <button class="action-btn add-expense" onclick="app.openFundExpenseModal('${sheetName}', ${item.rowIndex})">+ Add</button>
                    <button class="action-btn view" onclick="app.viewDetails('${encodeURIComponent(item.spentList || '[]')}')">View</button>
                </td>
            </tr>
        `).join('');
    }
    
    openFundExpenseModal(sheetName, rowIndex) {
        document.getElementById('fundExpenseForm').reset();
        document.getElementById('fundExpenseSheetName').value = sheetName;
        document.getElementById('fundExpenseRowIndex').value = rowIndex;
        document.getElementById('fundExpenseModalTitle').textContent = `Add to ${sheetName}`;
        document.getElementById('fundExpenseModal').classList.add('active');
    }
    
    closeFundExpenseModal() {
        document.getElementById('fundExpenseModal').classList.remove('active');
    }
    
    async saveFundExpense() {
        const sheetName = document.getElementById('fundExpenseSheetName').value;
        const rowIndex = parseInt(document.getElementById('fundExpenseRowIndex').value);
        const amount = parseFloat(document.getElementById('fundExpenseAmount').value) || 0;
        const remarks = document.getElementById('fundExpenseRemarks').value.trim();
        
        if (amount <= 0 || !remarks) {
            this.showToast('Fill all fields', 'warning');
            return;
        }
        
        try {
            this.showToast('Adding...', 'info');
            await chipsAPI.addExpense(sheetName, { rowIndex, amount, remarks });
            this.closeFundExpenseModal();
            await this.syncData();
            this.showToast('Added!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    viewDetails(encodedList) {
        let items = [];
        try {
            items = JSON.parse(decodeURIComponent(encodedList));
        } catch(e) {}
        
        const container = document.getElementById('detailsList');
        
        if (items.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No details</p>';
        } else {
            container.innerHTML = items.map(item => `
                <div class="detail-item">
                    <div class="detail-info">
                        <div class="detail-remarks">${item.remarks}</div>
                    </div>
                    <div class="detail-amount negative">${formatCurrency(item.amount)}</div>
                </div>
            `).join('');
        }
        
        document.getElementById('viewDetailsModal').classList.add('active');
    }
    
    closeViewDetailsModal() {
        document.getElementById('viewDetailsModal').classList.remove('active');
    }
    
    // ===== SETTINGS =====
    
    openSettings() {
        const settings = getSettings();
        document.getElementById('webAppUrl').value = settings.webAppUrl || '';
        document.getElementById('autoSync').checked = settings.autoSync !== false;
        document.getElementById('settingsOverlay').classList.add('active');
    }
    
    closeSettings() {
        document.getElementById('settingsOverlay').classList.remove('active');
    }
    
    async handleTestConnection() {
        const url = document.getElementById('webAppUrl').value;
        if (!url) { this.showToast('Enter URL', 'warning'); return; }
        
        saveSettings({ ...getSettings(), webAppUrl: url });
        chipsAPI.updateSettings();
        
        this.showToast('Testing...', 'info');
        const result = await chipsAPI.testConnection();
        this.showToast(result.success ? '✅ Connected!' : '❌ ' + result.message, result.success ? 'success' : 'error');
    }
    
    handleSaveSettings() {
        const settings = {
            webAppUrl: document.getElementById('webAppUrl').value,
            autoSync: document.getElementById('autoSync').checked
        };
        
        saveSettings(settings);
        chipsAPI.updateSettings();
        this.setupAutoSync();
        this.closeSettings();
        this.showToast('Saved!', 'success');
        
        if (settings.webAppUrl) this.syncData();
    }
    
    // ===== TOAST =====
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChipsApp();
});
