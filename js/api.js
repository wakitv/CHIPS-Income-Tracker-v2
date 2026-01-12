// ===================================
// CHIPS Income Tracker v2 - API Handler
// ===================================

class ChipsAPI {
    constructor() {
        this.settings = getSettings();
    }
    
    updateSettings() {
        this.settings = getSettings();
    }
    
    isConfigured() {
        return this.settings.webAppUrl && this.settings.webAppUrl.length > 0;
    }
    
    async request(action, params = {}) {
        if (!this.isConfigured()) {
            throw new Error('Configure Web App URL in Settings');
        }
        
        const url = new URL(this.settings.webAppUrl);
        url.searchParams.append('action', action);
        
        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'object') {
                url.searchParams.append(key, JSON.stringify(value));
            } else {
                url.searchParams.append(key, value);
            }
        }
        
        try {
            const response = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            if (data.success === false) throw new Error(data.error || 'Unknown error');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // ===== GET DATA =====
    async getAllData() { return await this.request('getData'); }
    async getCFRData() { return await this.request('getCFRData'); }
    async getExpensesData() { return await this.request('getExpensesData'); }
    async getWeeklyData() { return await this.request('getWeeklyData'); }
    async getTeamData() { return await this.request('getTeamData'); }
    async getSiteFundData() { return await this.request('getSiteFundData'); }
    async getRetainedData() { return await this.request('getRetainedData'); }
    async getSavingsData() { return await this.request('getSavingsData'); }
    async getLastNetChips() { return await this.request('getLastNetChips'); }
    
    // ===== CFR ENTRIES =====
    async addCFREntry(data) { return await this.request('addCFREntry', { data }); }
    async updateCFREntry(data) { return await this.request('updateCFREntry', { data }); }
    async deleteCFREntry(rowIndex) { return await this.request('deleteCFREntry', { rowIndex }); }
    
    // ===== OTHER EXPENSES =====
    async addExpensesEntry(data) { return await this.request('addExpensesEntry', { data }); }
    async updateExpensesEntry(data) { return await this.request('updateExpensesEntry', { data }); }
    async deleteExpensesEntry(rowIndex) { return await this.request('deleteExpensesEntry', { rowIndex }); }
    
    // ===== WEEKLY SUMMARY =====
    async addWeeklySummary(data) { return await this.request('addWeeklySummary', { data }); }
    async updateWeeklySummary(data) { return await this.request('updateWeeklySummary', { data }); }
    async deleteWeeklySummary(rowIndex) { return await this.request('deleteWeeklySummary', { rowIndex }); }
    async calculateWeeklySummary(startDate, endDate) { return await this.request('calculateWeeklySummary', { startDate, endDate }); }
    
    // ===== FUND EXPENSES =====
    async addExpense(sheetName, data) { return await this.request('addExpense', { sheetName, data }); }
    
    // ===== TEST =====
    async testConnection() {
        try {
            await this.request('getData');
            return { success: true, message: 'Connected!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Cache manager
class CacheManager {
    constructor() { this.key = CONFIG.STORAGE_KEYS.CACHE; }
    
    save(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify({ timestamp: Date.now(), data }));
        } catch (e) { console.warn('Cache save failed:', e); }
    }
    
    load() {
        try {
            const cached = localStorage.getItem(this.key);
            if (cached) return JSON.parse(cached);
        } catch (e) { console.warn('Cache load failed:', e); }
        return null;
    }
    
    clear() { localStorage.removeItem(this.key); }
}

window.chipsAPI = new ChipsAPI();
window.cacheManager = new CacheManager();
