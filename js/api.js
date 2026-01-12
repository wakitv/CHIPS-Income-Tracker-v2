// ===================================
// CHIPS Income Tracker v2 - API Handler
// ===================================

class ChipsAPI {
    constructor() {
        this.settings = getSettings();
    }
    
    // Update settings
    updateSettings() {
        this.settings = getSettings();
    }
    
    // Check if API is configured
    isConfigured() {
        return this.settings.webAppUrl && this.settings.webAppUrl.length > 0;
    }
    
    // Make API request
    async request(action, params = {}) {
        if (!this.isConfigured()) {
            throw new Error('Please configure your Google Apps Script Web App URL in Settings');
        }
        
        const url = new URL(this.settings.webAppUrl);
        url.searchParams.append('action', action);
        
        // Add additional parameters
        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'object') {
                url.searchParams.append(key, JSON.stringify(value));
            } else {
                url.searchParams.append(key, value);
            }
        }
        
        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                redirect: 'follow'
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            if (data.success === false) {
                throw new Error(data.error || 'Unknown error');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // ===== DATA FETCHING =====
    
    async getAllData() {
        return await this.request('getData');
    }
    
    async getIncomeData() {
        return await this.request('getIncomeData');
    }
    
    async getWeeklyData() {
        return await this.request('getWeeklyData');
    }
    
    async getSiteFundData() {
        return await this.request('getSiteFundData');
    }
    
    async getRetainedData() {
        return await this.request('getRetainedData');
    }
    
    async getSavingsData() {
        return await this.request('getSavingsData');
    }
    
    async getLastNetChips() {
        const result = await this.request('getLastNetChips');
        return result;
    }
    
    // ===== DATA WRITING =====
    
    async addIncomeEntry(data) {
        return await this.request('addIncomeEntry', { data });
    }
    
    async updateIncomeEntry(data) {
        return await this.request('updateIncomeEntry', { data });
    }
    
    async deleteIncomeEntry(rowIndex) {
        return await this.request('deleteIncomeEntry', { rowIndex });
    }
    
    async addWeeklySummary(data) {
        return await this.request('addWeeklySummary', { data });
    }
    
    async updateWeeklySummary(data) {
        return await this.request('updateWeeklySummary', { data });
    }
    
    async deleteWeeklySummary(rowIndex) {
        return await this.request('deleteWeeklySummary', { rowIndex });
    }
    
    async addExpense(sheetName, data) {
        return await this.request('addExpense', { sheetName, data });
    }
    
    async calculateWeeklySummary(startDate, endDate) {
        return await this.request('calculateWeeklySummary', { startDate, endDate });
    }
    
    // ===== CONNECTION TEST =====
    
    async testConnection() {
        try {
            const result = await this.request('getData');
            return {
                success: true,
                message: 'Connection successful! Data loaded.'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// Cache manager
class CacheManager {
    constructor() {
        this.key = CONFIG.STORAGE_KEYS.CACHE;
    }
    
    save(data) {
        try {
            const cacheData = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(this.key, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Cache save failed:', e);
        }
    }
    
    load() {
        try {
            const cached = localStorage.getItem(this.key);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            console.warn('Cache load failed:', e);
        }
        return null;
    }
    
    clear() {
        localStorage.removeItem(this.key);
    }
}

// Export instances
window.chipsAPI = new ChipsAPI();
window.cacheManager = new CacheManager();
