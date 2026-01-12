// ===================================
// CHIPS Income Tracker v2 - Main App
// ===================================

class ChipsApp {
    constructor() {
        // Data stores
        this.data = {
            income: [],
            weekly: [],
            siteFund: [],
            retained: [],
            savings: [],
            lastNetChips: 0
        };
        
        // Temporary data for forms
        this.tempOtherExpenses = [];
        this.tempChipsIn = [];
        
        // Chart instance
        this.chart = null;
        
        // Auto-sync interval
        this.syncInterval = null;
        
        // Initialize app
        this.init();
    }
    
    // Initialize the application
    async init() {
        // Show splash screen
        await this.showSplash();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load cached data first
        this.loadFromCache();
        
        // Try to sync with Google Sheets
        await this.syncData();
        
        // Setup auto-sync
        this.setupAutoSync();
        
        // Render initial view
        this.renderDashboard();
    }
    
    // Show splash screen
    async showSplash() {
        return new Promise(resolve => {
            setTimeout(() => {
                document.getElementById('splash').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                resolve();
            }, 2500);
        });
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Menu button (mobile)
        document.getElementById('menuBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('sidebarOverlay').classList.toggle('active');
        });
        
        // Sidebar overlay click
        document.getElementById('sidebarOverlay').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('active');
            document.getElementById('sidebarOverlay').classList.remove('active');
        });
        
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.handleNavigation(item));
        });
        
        // Bottom navigation items
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => this.handleNavigation(item));
        });
        
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => this.handleRefresh());
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('settingsClose').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsCancel').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsSave').addEventListener('click', () => this.handleSaveSettings());
        document.getElementById('testConnection').addEventListener('click', () => this.handleTestConnection());
        
        // Add buttons
        document.getElementById('addIncomeBtn')?.addEventListener('click', () => this.openIncomeModal());
        document.getElementById('addWeeklyBtn')?.addEventListener('click', () => this.openWeeklyModal());
        
        // Income form listeners
        ['incomeCFR', 'incomeAgentComm', 'incomeLoaderSalary', 'incomeChipsOut'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.calculateIncomeFields());
        });
        
        // Weekly GGR listener
        document.getElementById('weeklyGGR')?.addEventListener('input', () => this.calculateWeeklyFields());
    }
    
    // Handle navigation
    handleNavigation(item) {
        const tab = item.dataset.tab;
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll(`.nav-item[data-tab="${tab}"]`).forEach(i => i.classList.add('active'));
        document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll(`.bottom-nav-item[data-tab="${tab}"]`).forEach(i => i.classList.add('active'));
        
        // Show correct tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        
        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebarOverlay').classList.remove('active');
        
        // Render content
        this.renderTab(tab);
    }
    
    // Render tab content
    renderTab(tab) {
        switch (tab) {
            case 'dashboard': this.renderDashboard(); break;
            case 'income': this.renderIncomeTable(); break;
            case 'weekly': this.renderWeeklyTable(); break;
            case 'sitefund': this.renderFundTable('siteFund'); break;
            case 'retained': this.renderFundTable('retained'); break;
            case 'savings': this.renderFundTable('savings'); break;
        }
    }
    
    // Handle refresh
    async handleRefresh() {
        const btn = document.getElementById('refreshBtn');
        btn.classList.add('spinning');
        await this.syncData();
        setTimeout(() => btn.classList.remove('spinning'), 1000);
    }
    
    // Sync data
    async syncData() {
        const syncStatus = document.getElementById('syncStatus');
        syncStatus.classList.add('syncing');
        syncStatus.querySelector('.sync-text').textContent = 'Syncing...';
        
        try {
            if (!chipsAPI.isConfigured()) {
                this.loadDemoData();
                syncStatus.classList.remove('syncing');
                syncStatus.querySelector('.sync-text').textContent = 'Demo Mode';
                this.showToast('Running in Demo Mode. Configure API in Settings.', 'warning');
                return;
            }
            
            const result = await chipsAPI.getAllData();
            
            this.data = {
                income: result.data.income || [],
                weekly: result.data.weekly || [],
                siteFund: result.data.siteFund || [],
                retained: result.data.retained || [],
                savings: result.data.savings || [],
                lastNetChips: result.data.lastNetChips || 0
            };
            
            // Cache data
            cacheManager.save(this.data);
            
            // Update sync status
            syncStatus.classList.remove('syncing', 'error');
            syncStatus.querySelector('.sync-text').textContent = 'Synced';
            
            // Refresh view
            const activeTab = document.querySelector('.nav-item.active')?.dataset.tab || 'dashboard';
            this.renderTab(activeTab);
            
            this.showToast('Data synced successfully!', 'success');
            
        } catch (error) {
            console.error('Sync error:', error);
            syncStatus.classList.remove('syncing');
            syncStatus.classList.add('error');
            syncStatus.querySelector('.sync-text').textContent = 'Sync Error';
            this.showToast(error.message, 'error');
        }
    }
    
    // Load demo data
    loadDemoData() {
        this.data = {
            income: [
                { rowIndex: 2, date: '2025-01-01', shiftTime: '12:00PM to 8:00PM', cfr: 25000, agentCommission: 1000, loaderSalary: 560, otherExpenses: 500, netIncome: 22940, chipsIn: 100000, chipsOut: 25000, netChips: 75000, totalChipsRemaining: 75000 },
                { rowIndex: 3, date: '2025-01-01', shiftTime: '8:00PM to 4:00AM', cfr: 18000, agentCommission: 800, loaderSalary: 560, otherExpenses: 200, netIncome: 16440, chipsIn: 75000, chipsOut: 18000, netChips: 57000, totalChipsRemaining: 57000 },
                { rowIndex: 4, date: '2025-01-02', shiftTime: '12:00PM to 8:00PM', cfr: 30000, agentCommission: 1200, loaderSalary: 560, otherExpenses: 800, netIncome: 27440, chipsIn: 57000, chipsOut: 30000, netChips: 27000, totalChipsRemaining: 27000 }
            ],
            weekly: [
                { rowIndex: 2, start: '2025-01-01', end: '2025-01-07', ggr: 500000, agentCommissions: 15000, loaderSalary: 11760, otherExpenses: 5000, netProfit: 468240, chipsOut: 200000, totalChipsRemaining: 50000, roi: 0.936, status: 'Profit', distributed80: 374592, team50: 234120, siteFund35: 163884, savings15: 70236 }
            ],
            siteFund: [
                { rowIndex: 2, start: '2025-01-01', end: '2025-01-07', sourceAmount: 374592, allocated: 163884, spent: 5000, remaining: 158884, spentList: '[{"amount":5000,"remarks":"Office supplies"}]' }
            ],
            retained: [
                { rowIndex: 2, start: '2025-01-01', end: '2025-01-07', sourceAmount: 468240, allocated: 93648, spent: 10000, remaining: 83648, spentList: '[{"amount":10000,"remarks":"Electric bill"}]' }
            ],
            savings: [
                { rowIndex: 2, start: '2025-01-01', end: '2025-01-07', sourceAmount: 374592, allocated: 70236, spent: 0, remaining: 70236, spentList: '[]' }
            ],
            lastNetChips: 27000
        };
    }
    
    // Load from cache
    loadFromCache() {
        const cached = cacheManager.load();
        if (cached && cached.data) {
            this.data = cached.data;
        }
    }
    
    // Setup auto-sync
    setupAutoSync() {
        const settings = getSettings();
        if (this.syncInterval) clearInterval(this.syncInterval);
        
        if (settings.autoSync && chipsAPI.isConfigured()) {
            this.syncInterval = setInterval(() => this.syncData(), CONFIG.APP.AUTO_SYNC_INTERVAL);
        }
    }
    
    // ===== RENDER FUNCTIONS =====
    
    renderDashboard() {
        const weekly = this.data.weekly || [];
        
        // Calculate totals
        const totalProfit = weekly.reduce((sum, w) => sum + (w.netProfit || 0), 0);
        const totalGGR = weekly.reduce((sum, w) => sum + (w.ggr || 0), 0);
        const totalChips = this.data.lastNetChips || (weekly.length > 0 ? weekly[weekly.length - 1].totalChipsRemaining : 0);
        const avgROI = weekly.length > 0 ? (weekly.reduce((sum, w) => sum + (w.roi || 0), 0) / weekly.length) * 100 : 0;
        
        document.getElementById('totalProfit').textContent = formatCurrency(totalProfit);
        document.getElementById('totalGGR').textContent = formatCurrency(totalGGR);
        document.getElementById('totalChips').textContent = formatNumber(totalChips);
        document.getElementById('avgROI').textContent = avgROI.toFixed(2) + '%';
        
        // Fund totals
        const siteFundTotal = this.data.siteFund?.reduce((sum, f) => sum + (f.remaining || 0), 0) || 0;
        const retainedTotal = this.data.retained?.reduce((sum, f) => sum + (f.remaining || 0), 0) || 0;
        const savingsTotal = this.data.savings?.reduce((sum, f) => sum + (f.remaining || 0), 0) || 0;
        
        document.getElementById('siteFundTotal').textContent = formatCurrency(siteFundTotal);
        document.getElementById('retainedTotal').textContent = formatCurrency(retainedTotal);
        document.getElementById('savingsTotal').textContent = formatCurrency(savingsTotal);
        
        this.renderWeeklyChart();
        this.renderRecentActivity();
    }
    
    renderWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;
        
        if (this.chart) this.chart.destroy();
        
        const weekly = this.data.weekly?.slice(-12) || [];
        
        const labels = weekly.map(w => {
            const date = new Date(w.start);
            return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
        });
        
        const profits = weekly.map(w => w.netProfit > 0 ? w.netProfit : 0);
        const losses = weekly.map(w => w.netProfit < 0 ? Math.abs(w.netProfit) : 0);
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Profit', data: profits, backgroundColor: 'rgba(0, 255, 136, 0.7)', borderColor: '#00ff88', borderWidth: 1, borderRadius: 4 },
                    { label: 'Loss', data: losses, backgroundColor: 'rgba(255, 71, 87, 0.7)', borderColor: '#ff4757', borderWidth: 1, borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#606070' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#606070', callback: v => '₱' + (v / 1000) + 'K' } }
                }
            }
        });
    }
    
    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        const income = this.data.income?.slice(-5).reverse() || [];
        
        if (income.length === 0) {
            container.innerHTML = '<div class="recent-item"><p style="color: var(--text-muted); text-align: center; width: 100%;">No recent activity</p></div>';
            return;
        }
        
        container.innerHTML = income.map(item => `
            <div class="recent-item">
                <div class="recent-icon">${item.netIncome >= 0 ? '📈' : '📉'}</div>
                <div class="recent-info">
                    <div class="recent-title">${item.shiftTime}</div>
                    <div class="recent-date">${formatDate(item.date)}</div>
                </div>
                <div class="recent-amount ${getValueClass(item.netIncome)}">${formatCurrency(item.netIncome)}</div>
            </div>
        `).join('');
    }
    
    renderIncomeTable() {
        const tbody = document.getElementById('incomeTableBody');
        const income = this.data.income || [];
        
        // Update mini stats
        document.getElementById('lastNetChips').textContent = formatNumber(this.data.lastNetChips);
        
        const today = new Date().toISOString().split('T')[0];
        const todayIncome = income.filter(i => i.date === today).reduce((sum, i) => sum + (i.netIncome || 0), 0);
        document.getElementById('todayIncome').textContent = formatCurrency(todayIncome);
        
        if (income.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; color: var(--text-muted);">No data. Click "Add Entry" to start.</td></tr>';
            return;
        }
        
        tbody.innerHTML = income.map(item => `
            <tr>
                <td>${formatDate(item.date)}</td>
                <td>${item.shiftTime}</td>
                <td class="positive">${formatCurrency(item.cfr)}</td>
                <td>${formatCurrency(item.agentCommission)}</td>
                <td>${formatCurrency(item.loaderSalary)}</td>
                <td>${formatCurrency(item.otherExpenses)}</td>
                <td class="${getValueClass(item.netIncome)}">${formatCurrency(item.netIncome)}</td>
                <td>${formatNumber(item.chipsIn)}</td>
                <td>${formatNumber(item.chipsOut)}</td>
                <td class="${getValueClass(item.netChips)}">${formatNumber(item.netChips)}</td>
                <td>
                    <button class="action-btn edit" onclick="app.editIncome(${item.rowIndex})">Edit</button>
                    <button class="action-btn delete" onclick="app.deleteIncome(${item.rowIndex})">Del</button>
                </td>
            </tr>
        `).join('');
    }
    
    renderWeeklyTable() {
        const tbody = document.getElementById('weeklyTableBody');
        const weekly = this.data.weekly || [];
        
        if (weekly.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align: center; color: var(--text-muted);">No data. Click "New Cutoff" to create.</td></tr>';
            return;
        }
        
        tbody.innerHTML = weekly.map(item => `
            <tr>
                <td>${formatDate(item.start)}</td>
                <td>${formatDate(item.end)}</td>
                <td class="positive">${formatCurrency(item.ggr)}</td>
                <td>${formatCurrency(item.agentCommissions)}</td>
                <td>${formatCurrency(item.loaderSalary)}</td>
                <td>${formatCurrency(item.otherExpenses)}</td>
                <td class="${getValueClass(item.netProfit)}">${formatCurrency(item.netProfit)}</td>
                <td class="${item.roi >= 0 ? 'positive' : 'negative'}">${(item.roi * 100).toFixed(2)}%</td>
                <td><span class="${item.status === 'Profit' ? 'status-profit' : 'status-loss'}">${item.status}</span></td>
                <td>${formatCurrency(item.distributed80)}</td>
                <td>${formatCurrency(item.team50)}</td>
                <td>${formatCurrency(item.siteFund35)}</td>
                <td>${formatCurrency(item.savings15)}</td>
            </tr>
        `).join('');
    }
    
    renderFundTable(type) {
        const tableId = type === 'siteFund' ? 'siteFundTable' : (type === 'retained' ? 'retainedTable' : 'savingsTable');
        const tbody = document.getElementById(tableId + 'Body');
        const data = this.data[type] || [];
        
        // Calculate totals
        const allocated = data.reduce((sum, f) => sum + (f.allocated || 0), 0);
        const spent = data.reduce((sum, f) => sum + (f.spent || 0), 0);
        const remaining = data.reduce((sum, f) => sum + (f.remaining || 0), 0);
        
        // Update summary cards
        if (type === 'siteFund') {
            document.getElementById('siteFundAllocated').textContent = formatCurrency(allocated);
            document.getElementById('siteFundSpent').textContent = formatCurrency(spent);
            document.getElementById('siteFundRemaining').textContent = formatCurrency(remaining);
            document.getElementById('siteFundRemaining').className = `fund-value ${getValueClass(remaining)}`;
        } else if (type === 'retained') {
            document.getElementById('retainedAllocated').textContent = formatCurrency(allocated);
            document.getElementById('retainedSpent').textContent = formatCurrency(spent);
            document.getElementById('retainedRemaining').textContent = formatCurrency(remaining);
            document.getElementById('retainedRemaining').className = `fund-value ${getValueClass(remaining)}`;
        } else {
            document.getElementById('savingsAllocated').textContent = formatCurrency(allocated);
            document.getElementById('savingsWithdrawn').textContent = formatCurrency(spent);
            document.getElementById('savingsBalance').textContent = formatCurrency(remaining);
            document.getElementById('savingsBalance').className = `fund-value ${getValueClass(remaining)}`;
        }
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No data available</td></tr>';
            return;
        }
        
        const sourceLabel = type === 'retained' ? 'Net Profit' : 'Distributed 80%';
        const allocLabel = type === 'siteFund' ? 'Site Fund 35%' : (type === 'retained' ? 'Retained 20%' : 'Savings 15%');
        const sheetName = type === 'siteFund' ? 'Site Fund 35%' : (type === 'retained' ? 'Retained 20%' : 'Savings 15%');
        
        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${formatDate(item.start)}</td>
                <td>${formatDate(item.end)}</td>
                <td>${formatCurrency(item.sourceAmount)}</td>
                <td class="positive">${formatCurrency(item.allocated)}</td>
                <td class="negative">${formatCurrency(item.spent)}</td>
                <td class="${getValueClass(item.remaining)}">${formatCurrency(item.remaining)}</td>
                <td>
                    <button class="action-btn add-expense" onclick="app.openExpenseModal('${sheetName}', ${item.rowIndex})">+ Expense</button>
                    <button class="action-btn view" onclick="app.viewExpenses('${item.spentList || '[]'}')">View</button>
                </td>
            </tr>
        `).join('');
    }
    
    // ===== INCOME MODAL =====
    
    openIncomeModal(editData = null) {
        this.tempOtherExpenses = [];
        this.tempChipsIn = [];
        
        // Reset form
        document.getElementById('incomeForm').reset();
        document.getElementById('incomeRowIndex').value = '';
        document.getElementById('otherExpensesList').innerHTML = '';
        document.getElementById('chipsInList').innerHTML = '';
        
        if (editData) {
            document.getElementById('incomeModalTitle').textContent = 'Edit Income Entry';
            document.getElementById('incomeRowIndex').value = editData.rowIndex;
            document.getElementById('incomeDate').value = formatDateForInput(editData.date);
            document.getElementById('incomeShift').value = editData.shiftTime;
            document.getElementById('incomeCFR').value = editData.cfr;
            document.getElementById('incomeAgentComm').value = editData.agentCommission;
            document.getElementById('incomeLoaderSalary').value = editData.loaderSalary;
            document.getElementById('incomeChipsOut').value = editData.chipsOut;
            
            // Load existing expenses
            try {
                this.tempOtherExpenses = JSON.parse(editData.otherExpensesList || '[]');
                this.tempChipsIn = JSON.parse(editData.chipsInList || '[]');
            } catch (e) {}
            
            this.renderOtherExpensesList();
            this.renderChipsInList();
        } else {
            document.getElementById('incomeModalTitle').textContent = 'Add Income Entry';
            document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('incomeLoaderSalary').value = '560';
            
            // Auto-fill chips in with last net chips
            const lastNetChips = this.data.lastNetChips || 0;
            document.getElementById('autoFillValue').textContent = formatNumber(lastNetChips);
            
            if (lastNetChips > 0) {
                this.tempChipsIn = [{ amount: lastNetChips, remarks: 'From previous shift' }];
                this.renderChipsInList();
            }
        }
        
        this.calculateIncomeFields();
        document.getElementById('incomeModal').classList.add('active');
    }
    
    closeIncomeModal() {
        document.getElementById('incomeModal').classList.remove('active');
    }
    
    addExpenseItem() {
        const amount = parseFloat(document.getElementById('newExpenseAmount').value) || 0;
        const remarks = document.getElementById('newExpenseRemarks').value.trim();
        
        if (amount <= 0) {
            this.showToast('Please enter a valid amount', 'warning');
            return;
        }
        
        this.tempOtherExpenses.push({ amount, remarks: remarks || 'No remarks' });
        this.renderOtherExpensesList();
        this.calculateIncomeFields();
        
        // Clear inputs
        document.getElementById('newExpenseAmount').value = '';
        document.getElementById('newExpenseRemarks').value = '';
    }
    
    removeExpenseItem(index) {
        this.tempOtherExpenses.splice(index, 1);
        this.renderOtherExpensesList();
        this.calculateIncomeFields();
    }
    
    renderOtherExpensesList() {
        const container = document.getElementById('otherExpensesList');
        container.innerHTML = this.tempOtherExpenses.map((item, index) => `
            <div class="multi-input-item">
                <span class="item-amount">${formatCurrency(item.amount)}</span>
                <span class="item-remarks">${item.remarks}</span>
                <button type="button" class="item-remove" onclick="app.removeExpenseItem(${index})">×</button>
            </div>
        `).join('');
    }
    
    addChipsInItem() {
        const amount = parseFloat(document.getElementById('newChipsInAmount').value) || 0;
        const remarks = document.getElementById('newChipsInRemarks').value.trim();
        
        if (amount <= 0) {
            this.showToast('Please enter a valid amount', 'warning');
            return;
        }
        
        this.tempChipsIn.push({ amount, remarks: remarks || 'No remarks' });
        this.renderChipsInList();
        this.calculateIncomeFields();
        
        // Clear inputs
        document.getElementById('newChipsInAmount').value = '';
        document.getElementById('newChipsInRemarks').value = '';
    }
    
    removeChipsInItem(index) {
        this.tempChipsIn.splice(index, 1);
        this.renderChipsInList();
        this.calculateIncomeFields();
    }
    
    renderChipsInList() {
        const container = document.getElementById('chipsInList');
        container.innerHTML = this.tempChipsIn.map((item, index) => `
            <div class="multi-input-item">
                <span class="item-amount">${formatNumber(item.amount)}</span>
                <span class="item-remarks">${item.remarks}</span>
                <button type="button" class="item-remove" onclick="app.removeChipsInItem(${index})">×</button>
            </div>
        `).join('');
    }
    
    calculateIncomeFields() {
        const cfr = parseFloat(document.getElementById('incomeCFR').value) || 0;
        const agentComm = parseFloat(document.getElementById('incomeAgentComm').value) || 0;
        const loaderSalary = parseFloat(document.getElementById('incomeLoaderSalary').value) || 0;
        const chipsOut = parseFloat(document.getElementById('incomeChipsOut').value) || 0;
        
        const totalOtherExpenses = this.tempOtherExpenses.reduce((sum, item) => sum + item.amount, 0);
        const totalChipsIn = this.tempChipsIn.reduce((sum, item) => sum + item.amount, 0);
        
        const netIncome = cfr - agentComm - loaderSalary - totalOtherExpenses;
        const netChips = totalChipsIn - chipsOut;
        
        document.getElementById('totalOtherExpenses').textContent = formatCurrency(totalOtherExpenses);
        document.getElementById('calculatedNetIncome').textContent = formatCurrency(netIncome);
        document.getElementById('totalChipsIn').textContent = formatNumber(totalChipsIn);
        document.getElementById('calculatedNetChips').textContent = formatNumber(netChips);
    }
    
    async saveIncomeEntry() {
        const rowIndex = document.getElementById('incomeRowIndex').value;
        const date = document.getElementById('incomeDate').value;
        const shiftTime = document.getElementById('incomeShift').value;
        const cfr = parseFloat(document.getElementById('incomeCFR').value) || 0;
        const agentCommission = parseFloat(document.getElementById('incomeAgentComm').value) || 0;
        const loaderSalary = parseFloat(document.getElementById('incomeLoaderSalary').value) || 0;
        const chipsOut = parseFloat(document.getElementById('incomeChipsOut').value) || 0;
        
        if (!date) {
            this.showToast('Please select a date', 'warning');
            return;
        }
        
        const data = {
            date,
            shiftTime,
            cfr,
            agentCommission,
            loaderSalary,
            otherExpensesList: this.tempOtherExpenses,
            chipsInList: this.tempChipsIn,
            chipsOut
        };
        
        if (rowIndex) {
            data.rowIndex = parseInt(rowIndex);
        }
        
        try {
            this.showToast('Saving...', 'info');
            
            if (rowIndex) {
                await chipsAPI.updateIncomeEntry(data);
            } else {
                await chipsAPI.addIncomeEntry(data);
            }
            
            this.closeIncomeModal();
            await this.syncData();
            this.showToast('Entry saved successfully!', 'success');
            
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    editIncome(rowIndex) {
        const item = this.data.income.find(i => i.rowIndex === rowIndex);
        if (item) {
            this.openIncomeModal(item);
        }
    }
    
    async deleteIncome(rowIndex) {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        
        try {
            await chipsAPI.deleteIncomeEntry(rowIndex);
            await this.syncData();
            this.showToast('Entry deleted!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    // ===== WEEKLY MODAL =====
    
    openWeeklyModal() {
        document.getElementById('weeklyForm').reset();
        document.getElementById('weeklyRowIndex').value = '';
        document.getElementById('weeklyAgentComms').value = '';
        document.getElementById('weeklyLoaderSalary').value = '';
        document.getElementById('weeklyOtherExp').value = '';
        document.getElementById('weeklyChipsOut').value = '';
        
        // Set default dates (last 7 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        
        document.getElementById('weeklyStart').value = start.toISOString().split('T')[0];
        document.getElementById('weeklyEnd').value = end.toISOString().split('T')[0];
        
        this.resetWeeklyCalculations();
        document.getElementById('weeklyModal').classList.add('active');
    }
    
    closeWeeklyModal() {
        document.getElementById('weeklyModal').classList.remove('active');
    }
    
    async calculateFromDates() {
        const startDate = document.getElementById('weeklyStart').value;
        const endDate = document.getElementById('weeklyEnd').value;
        
        if (!startDate || !endDate) {
            this.showToast('Please select start and end dates', 'warning');
            return;
        }
        
        try {
            if (chipsAPI.isConfigured()) {
                this.showToast('Calculating from Income Tracker...', 'info');
                const result = await chipsAPI.calculateWeeklySummary(startDate, endDate);
                
                document.getElementById('weeklyAgentComms').value = result.agentCommissions || 0;
                document.getElementById('weeklyLoaderSalary').value = result.loaderSalary || 0;
                document.getElementById('weeklyOtherExp').value = result.otherExpenses || 0;
                document.getElementById('weeklyChipsOut').value = result.chipsOut || 0;
                
                this.calculateWeeklyFields();
                this.showToast('Data calculated from Income Tracker!', 'success');
            } else {
                // Demo mode - calculate from local data
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59);
                
                let agentComms = 0, loaderSalary = 0, otherExp = 0, chipsOut = 0;
                
                this.data.income.forEach(item => {
                    const itemDate = new Date(item.date);
                    if (itemDate >= start && itemDate <= end) {
                        agentComms += item.agentCommission || 0;
                        loaderSalary += item.loaderSalary || 0;
                        otherExp += item.otherExpenses || 0;
                        chipsOut += item.chipsOut || 0;
                    }
                });
                
                document.getElementById('weeklyAgentComms').value = agentComms;
                document.getElementById('weeklyLoaderSalary').value = loaderSalary;
                document.getElementById('weeklyOtherExp').value = otherExp;
                document.getElementById('weeklyChipsOut').value = chipsOut;
                
                this.calculateWeeklyFields();
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    calculateWeeklyFields() {
        const ggr = parseFloat(document.getElementById('weeklyGGR').value) || 0;
        const agentComms = parseFloat(document.getElementById('weeklyAgentComms').value) || 0;
        const loaderSalary = parseFloat(document.getElementById('weeklyLoaderSalary').value) || 0;
        const otherExp = parseFloat(document.getElementById('weeklyOtherExp').value) || 0;
        
        const netProfit = ggr - agentComms - loaderSalary - otherExp;
        const roi = ggr > 0 ? (netProfit / ggr) : 0;
        const status = netProfit >= 0 ? 'Profit' : 'Loss';
        const distributed80 = netProfit * 0.80;
        const team50 = netProfit * 0.50;
        const site35 = netProfit * 0.35;
        const savings15 = netProfit * 0.15;
        
        document.getElementById('calcNetProfit').textContent = formatCurrency(netProfit);
        document.getElementById('calcNetProfit').className = `calc-value ${getValueClass(netProfit)}`;
        document.getElementById('calcROI').textContent = (roi * 100).toFixed(2) + '%';
        document.getElementById('calcStatus').textContent = status;
        document.getElementById('calcStatus').style.color = status === 'Profit' ? 'var(--green)' : 'var(--red)';
        document.getElementById('calcDist80').textContent = formatCurrency(distributed80);
        document.getElementById('calcTeam50').textContent = formatCurrency(team50);
        document.getElementById('calcSite35').textContent = formatCurrency(site35);
        document.getElementById('calcSavings15').textContent = formatCurrency(savings15);
    }
    
    resetWeeklyCalculations() {
        document.getElementById('calcNetProfit').textContent = '₱0';
        document.getElementById('calcROI').textContent = '0%';
        document.getElementById('calcStatus').textContent = '-';
        document.getElementById('calcDist80').textContent = '₱0';
        document.getElementById('calcTeam50').textContent = '₱0';
        document.getElementById('calcSite35').textContent = '₱0';
        document.getElementById('calcSavings15').textContent = '₱0';
    }
    
    async saveWeeklySummary() {
        const start = document.getElementById('weeklyStart').value;
        const end = document.getElementById('weeklyEnd').value;
        const ggr = parseFloat(document.getElementById('weeklyGGR').value) || 0;
        
        if (!start || !end || ggr <= 0) {
            this.showToast('Please fill in all required fields', 'warning');
            return;
        }
        
        const data = { start, end, ggr };
        
        try {
            this.showToast('Saving weekly summary...', 'info');
            await chipsAPI.addWeeklySummary(data);
            this.closeWeeklyModal();
            await this.syncData();
            this.showToast('Weekly summary saved!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    // ===== EXPENSE MODAL =====
    
    openExpenseModal(sheetName, rowIndex) {
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseSheetName').value = sheetName;
        document.getElementById('expenseRowIndex').value = rowIndex;
        document.getElementById('expenseModalTitle').textContent = `Add Expense - ${sheetName}`;
        document.getElementById('expenseModal').classList.add('active');
    }
    
    closeExpenseModal() {
        document.getElementById('expenseModal').classList.remove('active');
    }
    
    async saveExpense() {
        const sheetName = document.getElementById('expenseSheetName').value;
        const rowIndex = parseInt(document.getElementById('expenseRowIndex').value);
        const amount = parseFloat(document.getElementById('expenseAmount').value) || 0;
        const remarks = document.getElementById('expenseRemarks').value.trim();
        
        if (amount <= 0 || !remarks) {
            this.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        try {
            this.showToast('Adding expense...', 'info');
            await chipsAPI.addExpense(sheetName, { rowIndex, amount, remarks });
            this.closeExpenseModal();
            await this.syncData();
            this.showToast('Expense added!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    viewExpenses(spentListJson) {
        let expenses = [];
        try {
            expenses = JSON.parse(spentListJson || '[]');
        } catch (e) {}
        
        const container = document.getElementById('expensesDetailList');
        
        if (expenses.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No expenses recorded</p>';
        } else {
            container.innerHTML = expenses.map(exp => `
                <div class="expense-item">
                    <div class="expense-info">
                        <div class="expense-remarks">${exp.remarks}</div>
                        <div class="expense-date">${exp.date ? formatDate(exp.date) : '-'}</div>
                    </div>
                    <div class="expense-amount">${formatCurrency(exp.amount)}</div>
                </div>
            `).join('');
        }
        
        document.getElementById('viewExpensesModal').classList.add('active');
    }
    
    closeViewExpensesModal() {
        document.getElementById('viewExpensesModal').classList.remove('active');
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
        const webAppUrl = document.getElementById('webAppUrl').value;
        
        if (!webAppUrl) {
            this.showToast('Please enter a Web App URL', 'warning');
            return;
        }
        
        saveSettings({ ...getSettings(), webAppUrl });
        chipsAPI.updateSettings();
        
        this.showToast('Testing connection...', 'info');
        const result = await chipsAPI.testConnection();
        
        if (result.success) {
            this.showToast('✅ ' + result.message, 'success');
        } else {
            this.showToast('❌ ' + result.message, 'error');
        }
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
        this.showToast('Settings saved!', 'success');
        
        if (settings.webAppUrl) {
            this.syncData();
        }
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
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChipsApp();
});
