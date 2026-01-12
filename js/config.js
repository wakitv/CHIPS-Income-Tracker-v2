// ===================================
// CHIPS Income Tracker v2 - Configuration
// ===================================

const CONFIG = {
    // App Settings
    APP: {
        NAME: 'CHIPS',
        VERSION: '2.0',
        AUTO_SYNC_INTERVAL: 30000, // 30 seconds
        CURRENCY: '₱',
        DATE_FORMAT: 'en-PH'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        SETTINGS: 'chips_v2_settings',
        CACHE: 'chips_v2_cache',
        LAST_SYNC: 'chips_v2_last_sync'
    }
};

// Default settings
const DEFAULT_SETTINGS = {
    webAppUrl: '',
    autoSync: true
};

// Helper function to get settings
function getSettings() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
    if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
}

// Helper function to save settings
function saveSettings(settings) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Helper function to format currency
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return CONFIG.APP.CURRENCY + num.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Helper function to format number
function formatNumber(value) {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Helper function to format date
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(CONFIG.APP.DATE_FORMAT, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper function to format date for input
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

// Helper function to get value class (positive/negative)
function getValueClass(value) {
    const num = parseFloat(value) || 0;
    if (num > 0) return 'positive';
    if (num < 0) return 'negative';
    return '';
}

// Export for use in other files
window.CONFIG = CONFIG;
window.getSettings = getSettings;
window.saveSettings = saveSettings;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.formatDate = formatDate;
window.formatDateForInput = formatDateForInput;
window.getValueClass = getValueClass;
